import { redirect } from "next/navigation";

// Passport 功能已整合到 Dashboard 的「⛓ 上链设置」区块
export default function PassportPage() {
  redirect("/dashboard");
}
