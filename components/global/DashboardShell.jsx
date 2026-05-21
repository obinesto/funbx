import Footer from "@/components/global/Footer";

export default function DashboardShell({ children }) {
  return (
    <main className="h-screen min-w-0 flex-1 overflow-hidden pt-16 md:ml-64">
      <div className="h-full overflow-y-auto overflow-x-hidden overscroll-contain">
        <div className="mx-auto flex min-h-full w-full max-w-[2000px] flex-col px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex-1">{children}</div>
          <Footer />
        </div>
      </div>
    </main>
  );
}

