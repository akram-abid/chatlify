import Navrow from "../components/navrow";

export default function Home() {
  return (
    <div className="grid grid-cols-[80px_300px_1fr] h-screen">
      <Navrow/>
      <div className="bg-surface-alt">contacts</div>
      <div className="bg-blue-900">conversation</div>
    </div>
  );
}