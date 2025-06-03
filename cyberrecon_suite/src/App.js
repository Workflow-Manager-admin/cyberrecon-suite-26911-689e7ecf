import React, { useState } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import TabbedWorkspace from "./components/TabbedWorkspace";
import Modal from "./components/Modal";
import HeaderBar from "./components/HeaderBar";
import SmartFooter from "./components/SmartFooter";
import DummyModule from "./modules/DummyModule";
import ReconDashboard from "./modules/ReconDashboard";
import VulnerabilityScanner from "./modules/VulnerabilityScanner";
// PUBLIC_INTERFACE
import WordlistGenerator from "./modules/WordlistGenerator";
import ReportGenerator from "./modules/ReportGenerator";
import BugBountyAggregator from "./modules/BugBountyAggregator";
import SettingsModule from "./modules/SettingsModule";
import ExploitationToolkit from "./modules/ExploitationToolkit";
import JSDebugger from "./modules/JSDebugger";

/**
 * Module metadata, for sidebar navigation; expand as needed.
 */
const MODULES = [
  {
    id: "recon",
    label: "Recon Dashboard",
    short: "Recon",
    icon: "🛰️"
  },
  {
    id: "scanner",
    label: "Vulnerability Scanner",
    short: "Scan",
    icon: "🕵️"
  },
  {
    id: "exploitation",
    label: "Exploitation",
    short: "Exploit",
    icon: "💣"
  },
  {
    id: "jsdebugger",
    label: "JS Debug",
    short: "JS",
    icon: "🧩"
  },
  {
    id: "wordlist",
    label: "Wordlist Gen",
    short: "List",
    icon: "📄"
  },
  {
    id: "report",
    label: "Reports",
    short: "Report",
    icon: "📝"
  },
  {
    id: "bounty",
    label: "Bounty",
    short: "Bounty",
    icon: "💰"
  },
  {
    id: "settings",
    label: "Settings",
    short: "Settings",
    icon: "⚙️"
  }
];

/**
 * Module registry: map module id to a component. Real modules replace DummyModule.
 */
const MODULE_COMPONENTS = {
  recon: ReconDashboard,
  scanner: VulnerabilityScanner,
  exploitation: ExploitationToolkit,
  jsdebugger: JSDebugger,
  wordlist: WordlistGenerator,
  report: ReportGenerator,
  bounty: BugBountyAggregator,
  settings: SettingsModule
};

function App() {
  const [activeModule, setActiveModule] = useState(MODULES[0].id);
  const [tabs, setTabs] = useState([
    {
      id: MODULES[0].id,
      title: MODULES[0].label,
      icon: MODULES[0].icon
    }
  ]);
  const [showModal, setShowModal] = useState(false);

  // Sidebar-open state
  const [sidebarOpen, setSidebarOpen] = useState(true);

  function openTab(moduleId) {
    setActiveModule(moduleId);
    if (!tabs.find(tab => tab.id === moduleId)) {
      const mod = MODULES.find(m => m.id === moduleId);
      setTabs([
        ...tabs,
        {
          id: mod.id,
          title: mod.label,
          icon: mod.icon
        }
      ]);
    }
    setSidebarOpen(true); // Always expose sidebar when opening a module via nav
  }

  function closeTab(moduleId) {
    let idx = tabs.findIndex(tab => tab.id === moduleId);
    if (idx === -1) return;
    const newTabs = tabs.filter(tab => tab.id !== moduleId);
    setTabs(newTabs.length ? newTabs : [tabs[0]]);
    if (activeModule === moduleId) {
      setActiveModule(newTabs.length ? newTabs[Math.max(idx - 1, 0)].id : MODULES[0].id);
    }
  }

  const ActiveComp = MODULE_COMPONENTS[activeModule];

  // Sidebar width must match sidebar component
  const SIDEBAR_WIDTH = 254;

  return (
    <div className="app-root" style={{ display: "flex", minHeight: "100vh", background: "var(--base-dark)" }}>
      <Sidebar
        modules={MODULES}
        activeModule={activeModule}
        onModuleSelect={openTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main
        role="main"
        style={{
          flex: 1,
          background: "var(--base-dark)",
          marginLeft: sidebarOpen ? 0 : 0,
          transition: "margin .22s cubic-bezier(.38,.71,.68,1)",
          minWidth: 0,
          position: "relative"
        }}
      >
        <HeaderBar onAboutClick={() => setShowModal(true)} />

        {/* Sidebar show button (appears if sidebar is closed) */}
        {!sidebarOpen && (
          <button
            aria-label="Show sidebar"
            style={{
              position: "fixed",
              top: 20,
              left: 15,
              zIndex: 29,
              background: "rgba(25,22,14,0.9)",
              color: "#ffad42",
              border: "2px solid #ff9800",
              borderRadius: 9,
              fontSize: 23,
              fontWeight: 800,
              boxShadow: "0 3.5px 18px #ff980041",
              width: 41,
              height: 41,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              outline: "none",
              transition: "background .14s,color .14s"
            }}
            onClick={() => setSidebarOpen(true)}
            tabIndex={0}
          >≡</button>
        )}

        <TabbedWorkspace
          tabs={tabs}
          activeTab={activeModule}
          onTabSelect={setActiveModule}
          onTabClose={closeTab}
        >
          <ActiveComp />
        </TabbedWorkspace>
      </main>

      <Modal
        isOpen={showModal}
        title="Welcome to CyberRecon Suite"
        onClose={() => setShowModal(false)}
      >
        <p>
          CyberRecon Suite provides modular recon, scanning, exploiting, and reporting tools for security professionals.<br />
          This is a UI scaffold. Expand modules to begin developing features.
        </p>
      </Modal>
      {/* Overlay smart footer always at viewport bottom */}
      <SmartFooter />
    </div>
  );
}

export default App;
