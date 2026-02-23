import { redirect } from "next/navigation";

export default function Home() {
   redirect("/login");
   
  return (
    <h1 className="text-center">Fianance Dashboard</h1>
  );
}
