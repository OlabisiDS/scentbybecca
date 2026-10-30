import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import Policy from "@/components/Policy";
import { ReviewsPage } from "@/components/Reviews";
import { INSTAGRAM_URL, STORY, STORY_CLOSING, STORY_TITLE, TIKTOK_URL, WHATSAPP_NUMBER } from "@/lib/config";
const wa = `https://wa.me/${WHATSAPP_NUMBER}`;
const ext = { target: "_blank", rel: "noopener noreferrer" };
const Privacy = () => (
  <div className="policy">
    <p className="muted small">Draft for the owner to review before launch. This is not legal advice.</p>
    <h2>What we collect</h2><p>When you place an order we collect your name, phone number and delivery address so we can process and deliver it. If you write a review we collect your name, your review and any photos you choose to add.</p>
    <h2>How we use it</h2><p>We use your details only to process your order, deliver it, confirm payment, answer your questions and show approved reviews. We do not sell your details.</p>
    <h2>Reviews and photos</h2><p>Reviews are checked before they appear. If you want your review or photo removed, contact us and we will remove it.</p>
    <h2>Payments</h2><p>Payments are made by bank transfer to the account shown on your order page. This website does not collect your card or bank login details.</p>
    <h2>Your choices</h2><p>You can ask us to correct or delete your order details by contacting us on <a href={wa} {...ext}>WhatsApp</a>.</p>
  </div>
);
const PAGES: Record<string, { title: string; body: React.ReactNode }> = {
  about: { title: "About us", body: <><h2 style={{ fontSize: 24, margin: "0 0 14px" }}>{STORY_TITLE}</h2>{STORY.map((t, i) => <p key={i} style={{ margin: "0 0 14px" }}>{t}</p>)}<p><b>{STORY_CLOSING}</b></p></> },
  contact: { title: "Contact us", body: <ul><li><a href={wa} {...ext}>WhatsApp</a></li><li><a href={INSTAGRAM_URL} {...ext}>Instagram</a></li><li><a href={TIKTOK_URL} {...ext}>TikTok</a></li></ul> },
  delivery: { title: "Delivery and refund policy", body: <Policy /> },
  privacy: { title: "Privacy", body: <Privacy /> },
};
export function generateMetadata({ params }: { params: { page: string } }) { const t = params.page === "reviews" ? "Customer reviews" : PAGES[params.page]?.title; return { title: t || "ScentbyBecca" }; }
export default function Info({ params }: { params: { page: string } }) {
  if (params.page === "reviews") return <ReviewsPage />;
  const p = PAGES[params.page];
  if (!p) notFound();
  return <><PageHeader title={p.title} pageKey={params.page} crumb={p.title} /><div className="wrap pad"><div style={{ maxWidth: 620 }}>{p.body}</div></div></>;
}
