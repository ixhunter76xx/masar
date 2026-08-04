import { redirect } from "next/navigation";

/**
 * الجذر → الكتالوج.
 *
 * في نسخة مركز حساب كان الجذر يذهب إلى `/login` لأن كل شيء خلف حساب.
 * أما مسار فمتجر قبل أن يكون منصّة: أول ما يراه الزائر هو ما يُباع،
 * لا نموذج دخول لحساب لا يملكه بعد.
 */
export default function Home() {
  redirect("/courses");
}
