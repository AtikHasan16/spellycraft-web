import { Outlet, useLocation } from "react-router";
import NavigationDock from "../components/NavigationDock";
import MinimalFooter from "../components/MinimalFooter";

/**
 * Universal Workspace Layout Shell
 * - No top header/navbar as mandated by the PRD
 * - Desktop/Tablet: Left padding to account for the floating dock
 * - Mobile: Bottom padding to account for the mobile dock
 * - Strict plum and white palette with centered workspace canvas
 * - Distraction-free MinimalFooter at base
 */
export default function WorkspaceLayout() {
  const { pathname } = useLocation();
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  const hideWorkspaceChrome = normalizedPath === "/workspace/developer/application";

  return (
    <div className="min-h-screen w-full bg-white text-body-dark relative flex flex-col antialiased overflow-x-hidden">
      {!hideWorkspaceChrome && <NavigationDock />}

      {/* Main Workspace Canvas with responsive offsets */}
      <main className={`flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col justify-start overflow-x-hidden ${
        hideWorkspaceChrome ? "" : "md:px-8 md:py-8 md:pl-28 md:pr-8 mb-24 md:mb-8"
      }`}>
        <Outlet />
      </main>

      {/* Minimal Footer */}
      {!hideWorkspaceChrome && (
        <div className="md:pl-24 mb-16 md:mb-0">
          <MinimalFooter />
        </div>
      )}
    </div>
  );
}
