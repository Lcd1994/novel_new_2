import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import Studio from "@/pages/Studio";
import ChapterEditor from "@/pages/ChapterEditor";
import CharacterCenter from "@/pages/CharacterCenter";
import WorldEditor from "@/pages/WorldEditor";
import OutlineView from "@/pages/OutlineView";
import Reader from "@/pages/Reader";
import Settings from "@/pages/Settings";
import Discussion from "@/pages/Discussion";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/discussion" element={<Discussion />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/studio/:projectId" element={<Studio />} />
        <Route path="/studio/:projectId/chapter/:chapterId" element={<ChapterEditor />} />
        <Route path="/characters/:projectId" element={<CharacterCenter />} />
        <Route path="/world/:projectId" element={<WorldEditor />} />
        <Route path="/outline/:projectId" element={<OutlineView />} />
        <Route path="/reader/:projectId/:chapterId" element={<Reader />} />
      </Routes>
    </Router>
  );
}
