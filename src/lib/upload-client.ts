"use client";

import {
  MAX_PART_RETRIES,
  ALLOWED_VIDEO_TYPE,
} from "@/lib/uploads";

type CreateResponse = {
  materialId: string;
  uploadId: string;
  partSize: number;
};

export type UploadHandle = {
  /** إلغاء الرفع وحذف ما رُفع */
  abort: () => void;
};

/**
 * رفع فيديو مجزّأ مباشرةً إلى R2.
 *
 * الملف لا يمرّ بخادم Next.js إطلاقًا — الخادم يوقّع الروابط فقط.
 * نستخدم XMLHttpRequest لا fetch لأن fetch لا يوفّر حدث تقدّم للرفع.
 */
export async function uploadVideo({
  courseId,
  file,
  title,
  description,
  onProgress,
  signal,
}: {
  courseId: string;
  file: File;
  title: string;
  description?: string;
  onProgress: (percent: number) => void;
  signal: AbortSignal;
}): Promise<{ materialId: string }> {
  const endpoint = `/api/courses/${courseId}/videos`;

  const post = async <T,>(body: unknown): Promise<T> => {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? "تعذّر إتمام الطلب.");
    return data as T;
  };

  const { materialId, uploadId, partSize } = await post<CreateResponse>({
    action: "create",
    title,
    description,
    contentType: ALLOWED_VIDEO_TYPE,
    sizeBytes: file.size,
  });

  const partCount = Math.ceil(file.size / partSize);
  const parts: { partNumber: number; etag: string }[] = [];
  // البايتات المكتملة من الأجزاء السابقة — لحساب نسبة إجمالية دقيقة
  let completedBytes = 0;

  const cleanup = async () => {
    await post({ action: "abort", materialId, uploadId }).catch(() => undefined);
  };

  signal.addEventListener("abort", () => void cleanup(), { once: true });

  try {
    for (let partNumber = 1; partNumber <= partCount; partNumber++) {
      if (signal.aborted) throw new DOMException("أُلغي الرفع", "AbortError");

      const start = (partNumber - 1) * partSize;
      const chunk = file.slice(start, Math.min(start + partSize, file.size));

      const etag = await uploadPartWithRetry({
        getUrl: () =>
          post<{ url: string }>({
            action: "sign-part",
            materialId,
            uploadId,
            partNumber,
          }).then((r) => r.url),
        chunk,
        signal,
        onChunkProgress: (loaded) => {
          const percent = ((completedBytes + loaded) / file.size) * 100;
          onProgress(Math.min(99, Math.round(percent)));
        },
      });

      parts.push({ partNumber, etag });
      completedBytes += chunk.size;
    }

    await post({ action: "complete", materialId, uploadId, parts });
    onProgress(100);
    return { materialId };
  } catch (error) {
    if (!signal.aborted) await cleanup();
    throw error;
  }
}

/** يرفع جزءًا واحدًا مع إعادة المحاولة عند الفشل العابر */
async function uploadPartWithRetry({
  getUrl,
  chunk,
  signal,
  onChunkProgress,
}: {
  getUrl: () => Promise<string>;
  chunk: Blob;
  signal: AbortSignal;
  onChunkProgress: (loaded: number) => void;
}): Promise<string> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_PART_RETRIES; attempt++) {
    try {
      const url = await getUrl();
      return await putChunk(url, chunk, signal, onChunkProgress);
    } catch (error) {
      if (signal.aborted) throw error;
      lastError = error;
      // تراجع أسّي بسيط قبل المحاولة التالية
      await new Promise((r) => setTimeout(r, 500 * 2 ** (attempt - 1)));
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("فشل رفع أحد أجزاء الملف.");
}

/** PUT جزء واحد مع تتبّع التقدّم — XHR لأن fetch لا يدعم upload progress */
function putChunk(
  url: string,
  chunk: Blob,
  signal: AbortSignal,
  onProgress: (loaded: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);

    xhr.upload.onprogress = (e) => onProgress(e.loaded);

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        // ETag مطلوب لإتمام الرفع المجزّأ.
        // يتطلب أن يكشفه CORS عبر ExposeHeaders — انظر README.
        const etag = xhr.getResponseHeader("ETag");
        if (!etag) {
          reject(
            new Error(
              "لم يصل ETag من R2 — تأكّد من إعداد CORS مع ExposeHeaders: [\"ETag\"].",
            ),
          );
          return;
        }
        // يُمرَّر كما ورد من R2 (بعلامتي التنصيص) لأن
        // CompleteMultipartUpload يتوقّعه بصيغته الأصلية
        resolve(etag);
      } else {
        reject(new Error(`فشل رفع الجزء (${xhr.status}).`));
      }
    };

    /*
     * `onerror` في طلب عابر للنطاق لا يعني انقطاع الشبكة غالبًا: المتصفح
     * يُطلقه بلا تفاصيل عندما يرفض CORS الطلب أيضًا، وهو السبب الأرجح
     * هنا لأن الرفع يذهب إلى R2 على نطاق آخر. أشهر صوره: تشغيل الموقع
     * على منفذ غير المدرَج في `AllowedOrigins` للدلو (المدرَج هو 3000 —
     * انظر README)، فيفشل الرفع على 3100 وحده بينما تعمل بقية المنصة.
     * الرسالة تذكر الاحتمالين لأن الأول يُرسل الباحث إلى الشبكة ويضيّع
     * وقته، والثاني هو ما يحتاج تعديلًا فعليًا.
     */
    xhr.onerror = () =>
      reject(
        new Error(
          "تعذّر الوصول إلى التخزين أثناء رفع الجزء. " +
            "افتح وحدة تحكّم المتصفح: هناك وحدها يظهر السبب — حجبُ CSP " +
            "أو رفضُ CORS أو انقطاع الشبكة.",
        ),
      );
    xhr.onabort = () => reject(new DOMException("أُلغي الرفع", "AbortError"));

    signal.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(chunk);
  });
}
