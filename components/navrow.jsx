import {
  faAdd,
  faGear,
  faRightFromBracket,
  faScrewdriverWrench,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Image from 'next/image';
import { FloatingDockDemo } from './ui/FloatingDockDemo';
import { Toggle } from './ui/toggle';
import { ThemeSwitcher } from './ui/shadcn-io/theme-switcher';
import ThemeSwitcherButton from './ThemeSwitcher';
import LogoutButton from './ui/LogoutButton';

const Navrow = () => {
  return (
    <div className="bg-mate flex flex-col items-center gap-2 p-2 h-screen">
      <div className='flex flex-col justify-center items-center gap-3'>
        <Image
          src="/logo.png"
          alt="logo"
          width={33}
          height={33}
          className="mb-2 pt-1"
        />
        <Image
          src="/profilepic.jpeg"
          alt="profile"
          width={45}
          height={45}
          className="rounded-full object-cover"
        />
      </div>

      <div className="w-8 h-px bg-accent/30 my-2"></div>

      <div className="flex flex-col justify-center items-center gap-3 flex-1 min-h-0">
        <div className="flex-1 w-full rounded-2xl p-2 flex flex-col gap-4 overflow-y-auto hover:bg-mate-light  transition-all duration-300 min-h-0 scrollbar-hide">
          <div className="w-[40px] h-[40px] bg-amber-400 rounded-[8px] flex-shrink-0"></div>
          <div className="w-[40px] h-[40px] bg-amber-400 rounded-[8px] flex-shrink-0"></div>
          <div className="w-[40px] h-[40px] bg-amber-400 rounded-[8px] flex-shrink-0"></div>
          <div className="w-[40px] h-[40px] bg-amber-400 rounded-[8px] flex-shrink-0"></div>
          <div className="w-[40px] h-[40px] bg-amber-400 rounded-[8px] flex-shrink-0"></div>
          <div className="w-[40px] h-[40px] bg-amber-400 rounded-[8px] flex-shrink-0"></div>
          <div className="w-[40px] h-[40px] bg-amber-400 rounded-[8px] flex-shrink-0"></div>
          <div className="w-[40px] h-[40px] bg-amber-400 rounded-[8px] flex-shrink-0"></div>
          <div className="w-[40px] h-[40px] bg-amber-400 rounded-[8px] flex-shrink-0"></div>
        </div>
        <div className="w-[40px] h-[40px] bg-mate-light rounded-[8px] flex items-center justify-center flex-shrink-0">
          <FontAwesomeIcon icon={faAdd} className="text-accent w-4" />
        </div>
      </div>

      <div className="w-8 h-px bg-accent/30 my-2"></div>

      <div className="flex flex-col justify-center items-center gap-3 ">
        <FontAwesomeIcon icon={faGear} className="w-6 text-accent" />
        <ThemeSwitcherButton />
        <LogoutButton />
      </div>
    </div>
  );
};

export default Navrow;