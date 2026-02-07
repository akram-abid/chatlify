const Contacts = ({ sections, updateSelectedThred }) => {
  return (
    <div className="flex flex-col gap-4 p-4 text-white">
      {sections.map((section) => (
        <div key={section.id}>
          <h3 className="text-sm font-semibold opacity-70">{section.name}</h3>

          <div className="mt-2 flex flex-col gap-1">
            {section.threads.map((thread) => (
              <div
                onClick={() => {
                  console.log("THE THREAD: ", thread)
                  updateSelectedThred(thread);
                }}
                key={thread.id}
                className="px-2 py-1 rounded hover:bg-white/10 cursor-pointer text-sm"
              >
                {thread.title}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Contacts;
