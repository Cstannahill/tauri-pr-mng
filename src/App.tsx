import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import ProjectsPage from '@/pages/ProjectsPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import TimelinePage from '@/pages/TimelinePage';
import KanbanPage from '@/pages/KanbanPage';

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route element={<MainLayout />}> 
        <Route index element={<Navigate to="/projects" />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="timeline" element={<TimelinePage />} />
        <Route path="kanban" element={<KanbanPage />} />
      </Route>
    </Routes>
  </BrowserRouter>
);

export default App;
