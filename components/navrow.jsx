import { faScrewdriverWrench } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Image from 'next/image';
import { FloatingDockDemo } from './ui/FloatingDockDemo';
import { Toggle } from './ui/toggle';
import { ThemeSwitcher } from './ui/shadcn-io/theme-switcher';
import ThemeSwitcherButton from './ThemeSwitcher';

const Navrow = () => {
  return (
    <div className="bg-mate flex flex-col items-center gap-2 py-2">
      <Image
        src="/logo.png"
        alt="logo"
        width={33}
        height={33}
        className="mb-4 pt-1"
      />
      <div className="rounded-full bg-primary p-1.5">
        <div className="rounded-full">
          <Image
            src="/profilepic.jpeg"
            alt="profile"
            width={50}
            height={50}
            className="rounded-full object-cover"
          />
        </div>
      </div>
      <div className="flex-1 bg-primary w-full rounded-2xl p-2 flex flex-col gap-6 overflow-hidden">
        <div className="w-full h-[60px] bg-amber-400 rounded-2xl"></div>
        <div className="w-full h-[60px] bg-amber-400 rounded-2xl"></div>
        <div className="w-full h-[60px] bg-amber-400 rounded-2xl"></div>
        <div className="w-full h-[60px] bg-amber-400 rounded-2xl"></div>
      </div>
      <FontAwesomeIcon icon={faScrewdriverWrench} className='w-7 text-accent' />
      <ThemeSwitcherButton />
    </div>
  );
};

export default Navrow;
