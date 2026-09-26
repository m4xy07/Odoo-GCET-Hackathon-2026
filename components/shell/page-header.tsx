type PageHeaderProps = {
  title: string;
  // the one primary button of the page ("NEW"), sits left of the title like the mockup
  action?: React.ReactNode;
  // search, filters, list/kanban toggle, pushed to the right
  children?: React.ReactNode;
};

// The title row under the top bar. Every page uses it so titles line up across the app.
export function PageHeader({ title, action, children }: PageHeaderProps) {
  return (
    <div className='mb-6 flex flex-wrap items-center gap-3 md:mb-8'>
      {action}
      <h1 className='text-[28px] font-semibold leading-[34px] tracking-tight text-text-strong-950'>{title}</h1>
      {children && <div className='flex w-full items-center gap-2 sm:ml-auto sm:w-auto'>{children}</div>}
    </div>
  );
}
