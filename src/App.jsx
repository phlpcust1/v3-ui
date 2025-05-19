// File: App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/auth/Login";
import Profile from "./pages/profile/Profile";
import { Students } from "./pages/students/Students";
import { Coaches } from "./pages/coaches/Coaches";
import { Assignment } from "./pages/assignment/Assignment";
import { CurriculumCoach } from "./pages/curriculum-coach/CurriculumCoach";
import { CoachDashboard } from "./pages/dashboard/CoachDashboard";
import { Curriculum } from "./pages/curriculum/Curriculum";
import { MyStudents } from "./pages/my-students/MyStudents";
import { StudentCourses } from "./pages/my-students/StudentCourses";
import { AcademicAdvisingForm } from "./pages/my-students/AcademicAdvisingForm";
import { MySubjects } from "./pages/subjects/MyCourses";
import Program from "./pages/programs/Program";
import CurriculumCoachesList from "./pages/programs/CurriculumCoachesList";
import Summary from "./pages/summary/Summary";
import SummaryDetails from "./pages/summary/SummaryDetails";
import CoachDetails from "./pages/programs/CoachDetails";
import { StudentSubjects } from "./pages/programs/StudentSubjects";
import SubjectSummary from "./pages/programs/SubjectSummary";
import { AcadForm } from "./pages/my-students/AcadForm";

const App = () => {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Login />} />

          <Route path="/profile" element={<Profile />} />
          <Route path="/students" element={<Students />} />
          <Route path="/coaches" element={<Coaches />} />
          <Route path="/manage-coaching" element={<Assignment />} />
          <Route path="/programs" element={<Program />} />
          <Route path="/curriculum-coach" element={<CurriculumCoach />} />
          <Route path="/dashboard" element={<CoachDashboard />} />
          <Route path="/curriculum" element={<Curriculum />} />
          <Route path="/my-students" element={<MyStudents />} />
          <Route path="/my-students/:id" element={<StudentCourses />} />
          <Route path="/my-subjects" element={<MySubjects />} />
          {/* <Route
            path="/academic-advising/:id"
            element={<AcademicAdvisingForm />}
          /> */}
          <Route path="/academic-advising/:id" element={<AcadForm />} />
          <Route
            path="/programs/coach-list/:id"
            element={<CurriculumCoachesList />}
          />

          <Route
            path="/programs/coach-details/:id"
            element={<CoachDetails />}
          />

          <Route
            path="/programs/student-subjects/:id"
            element={<StudentSubjects />}
          />

          {/* <Route path="/programs/course/:id" element={<SubjectSummary />} /> */}

          <Route path="/summary" element={<Summary />} />
          <Route path="/summary/:id" element={<SummaryDetails />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
