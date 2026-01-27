import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const SearchInput = () => {
  return (
    <div className="relative w-full  px-1 mt-1">
      <FontAwesomeIcon 
        icon={faSearch} 
        className="absolute left-4 top-1/2 -translate-y-1/2 w-4 text-accent/60"
      />
      <input
        type="text"
        placeholder="Search..."
        className="w-full bg-mate rounded-[14px] ring-2 ring-mate-lightest pl-10 pr-4 py-2.5 text-sm text-accent placeholder:text-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
      />
    </div>
  );
};

export default SearchInput;