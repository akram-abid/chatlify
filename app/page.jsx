import Contacts from "@/components/Contacts";
import Navrow from "../components/navrow";

export default function Home() {
  return (
    <div className="grid grid-cols-[70px_300px_1fr] h-screen dark">
      <Navrow/>
      <Contacts />
      <div className="bg-blue-900">conversation</div>
    </div>
  );
}