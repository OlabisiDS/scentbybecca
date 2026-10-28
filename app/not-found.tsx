import Link from "next/link";
export default function NotFound() {
  return <div className="wrap pad"><h1>Page not found</h1><p className="muted">That page does not exist.</p><Link className="btn fit" href="/shop">Continue shopping</Link></div>;
}
