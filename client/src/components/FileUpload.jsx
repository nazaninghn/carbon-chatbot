import { useRef } from 'react';

export default function FileUpload({ onUpload, hint }) {
  const fileRef = useRef(null);

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      e.target.value = '';
    }
  };

  return (
    <>
      <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png" onChange={handleChange} className="hidden" />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 hover:text-gray-800 hover:bg-gray-200 flex items-center justify-center transition-all"
        title={hint}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
        </svg>
      </button>
    </>
  );
}
