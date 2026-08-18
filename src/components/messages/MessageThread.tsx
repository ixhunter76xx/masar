"use client";

import * as React from "react";
import { Check, CheckCheck, Send } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { Button } from "@/components/ui/Button";
import { HelpText, Textarea } from "@/components/ui/Field";
import { EASE, DUR, SPRING } from "@/lib/motion";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  sendCourseMessage,
  markCourseThreadRead,
} from "@/app/(app)/learn/[courseId]/(tabs)/messages/actions";
import { MESSAGE_MAX_LENGTH, type ThreadMessage } from "@/lib/messages";

/**
 * خيط المحادثة: الرسائل ثم صندوق الكتابة.
 *
 * رسائلي على جهة النهاية (يسار في RTL) ورسائل الطرف الآخر على جهة
 * البداية — بخصائص منطقية، فينقلب الترتيب وحده لو تغيّر اتجاه القراءة.
 */
export function MessageThread({
  courseId,
  studentId,
  peerName,
  messages,
}: {
  courseId: string;
  studentId: string;
  peerName: string;
  messages: ThreadMessage[];
}) {
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const formRef = React.useRef<HTMLFormElement>(null);
  const endRef = React.useRef<HTMLDivElement>(null);

  /* التعليم كمقروء بعد العرض لا أثناءه: الكتابة داخل التصيير تُفسد
     التخزين المؤقت وتُنفَّذ مرتين في وضع التطوير الصارم. */
  const unreadFromPeer = messages.filter((m) => !m.isMine).length;
  React.useEffect(() => {
    if (unreadFromPeer === 0) return;
    void markCourseThreadRead(courseId, studentId);
  }, [courseId, studentId, unreadFromPeer]);

  /* آخر رسالة في المجال المرئي — سلوك متوقّع في أي محادثة */
  React.useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  function onSubmit(formData: FormData) {
    const body = String(formData.get("body") ?? "");
    setError(null);

    startTransition(async () => {
      const result = await sendCourseMessage(courseId, studentId, body);
      if (result.ok) formRef.current?.reset();
      else setError(result.error);
    });
  }

  return (
    <div className="space-y-4">
      {messages.length === 0 ? (
        <p className="rounded-card border border-line bg-panel px-5 py-8 text-center text-sm text-subtle">
          لا رسائل بعد. اكتب أول رسالة إلى {peerName}.
        </p>
      ) : (
        <ol className="space-y-2.5">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.li
                key={message.id}
                layout
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={SPRING.soft}
                className={cn(
                  "flex",
                  message.isMine ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-field px-4 py-3 text-sm leading-relaxed",
                    message.isMine
                      ? "bg-accent-deep text-paper"
                      : "border border-line bg-panel text-paper",
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">
                    {message.body}
                  </p>

                  <p
                    className={cn(
                      "mt-1.5 flex items-center gap-1.5 text-[11px]",
                      message.isMine ? "text-paper/70" : "text-subtle",
                    )}
                  >
                    <time dateTime={message.createdAt.toISOString()}>
                      {relativeTime(message.createdAt)}
                    </time>

                    {message.isMine &&
                      (message.readAt ? (
                        <span className="flex items-center gap-1">
                          <CheckCheck size={13} aria-hidden="true" />
                          <span className="sr-only">قرأها {peerName}</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Check size={13} aria-hidden="true" />
                          <span className="sr-only">أُرسلت ولم تُقرأ بعد</span>
                        </span>
                      ))}
                  </p>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      )}

      <div ref={endRef} />

      <form ref={formRef} action={onSubmit} className="space-y-2">
        <label htmlFor="body" className="sr-only">
          نص الرسالة إلى {peerName}
        </label>
        <Textarea
          id="body"
          name="body"
          rows={3}
          required
          maxLength={MESSAGE_MAX_LENGTH}
          disabled={pending}
          placeholder={`اكتب رسالة إلى ${peerName}…`}
          aria-describedby={error ? "message-error" : undefined}
          invalid={Boolean(error)}
        />

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DUR.fast, ease: EASE.out }}
          >
            <HelpText id="message-error" tone="danger" role="alert">
              {error}
            </HelpText>
          </motion.div>
        )}

        <div className="flex justify-end">
          <Button type="submit" loading={pending}>
            <Send size={16} strokeWidth={1.75} aria-hidden="true" />
            إرسال
          </Button>
        </div>
      </form>
    </div>
  );
}
