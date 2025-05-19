import { MdLogout, MdMenu } from "react-icons/md";

export function Navbar() {
  return (
    <nav className="navbar bg-white w-full border-y-2 py-4">
      <div className="mx-2 flex-1 px-2">
        {/* <div className="flex gap-6 items-center">
          <MdMenu className="w-7 h-7 text-gray-600" />
          <img src="/logo.svg" alt="" />
        </div> */}
      </div>
      <div className="hidden lg:block">
        <div className="flex gap-2 items-center justify-center">
          <div>
            <p className="text-sm font-bold">John Doe</p>
            <p className="text-xs">21-1234</p>
          </div>
          <div>
            <img src="/logo.png" alt="" className="w-12 h-12" />
          </div>
        </div>
      </div>
    </nav>
  );
}
