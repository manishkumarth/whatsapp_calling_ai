import SearchBar from '../ui/SearchBar';
import Pagination from '../ui/Pagination';

export default function ContactFilters({ search, onSearchChange, page, pages, onPageChange }) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="w-full sm:w-72">
        <SearchBar value={search} onChange={onSearchChange} placeholder="Search contacts..." />
      </div>
      <Pagination page={page} pages={pages} onPageChange={onPageChange} />
    </div>
  );
}
