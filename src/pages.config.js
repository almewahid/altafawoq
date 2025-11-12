import Home from './pages/Home';
import Browse from './pages/Browse';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherGroups from './pages/TeacherGroups';
import TeacherCoupons from './pages/TeacherCoupons';
import Messages from './pages/Messages';
import TeacherDetails from './pages/TeacherDetails';
import CenterDetails from './pages/CenterDetails';
import StudentDashboard from './pages/StudentDashboard';
import StudentAssignments from './pages/StudentAssignments';
import AdminDashboard from './pages/AdminDashboard';
import Chat from './pages/Chat';
import VideoSession from './pages/VideoSession';
import CompleteProfile from './pages/CompleteProfile';
import EnrollGroup from './pages/EnrollGroup';
import EducationalServices from './pages/EducationalServices';
import CenterAdminDashboard from './pages/CenterAdminDashboard';
import TeacherWallet from './pages/TeacherWallet';
import TeacherCalendar from './pages/TeacherCalendar';
import StudentCalendar from './pages/StudentCalendar';
import Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Browse": Browse,
    "TeacherDashboard": TeacherDashboard,
    "TeacherGroups": TeacherGroups,
    "TeacherCoupons": TeacherCoupons,
    "Messages": Messages,
    "TeacherDetails": TeacherDetails,
    "CenterDetails": CenterDetails,
    "StudentDashboard": StudentDashboard,
    "StudentAssignments": StudentAssignments,
    "AdminDashboard": AdminDashboard,
    "Chat": Chat,
    "VideoSession": VideoSession,
    "CompleteProfile": CompleteProfile,
    "EnrollGroup": EnrollGroup,
    "EducationalServices": EducationalServices,
    "CenterAdminDashboard": CenterAdminDashboard,
    "TeacherWallet": TeacherWallet,
    "TeacherCalendar": TeacherCalendar,
    "StudentCalendar": StudentCalendar,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: Layout,
};