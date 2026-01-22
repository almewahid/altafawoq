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
import GroupDetails from './pages/GroupDetails';
import StudentProgress from './pages/StudentProgress';
import CreateStudyGroup from './pages/CreateStudyGroup';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Layout from './Layout.jsx';

export const PAGES = {
    home: { component: Home, protected: false },
    browse: { component: Browse, protected: false },
    privacypolicy: { component: PrivacyPolicy, protected: false },
    teacherdashboard: { component: TeacherDashboard, protected: true },
    teachergroups: { component: TeacherGroups, protected: true },
    teachercoupons: { component: TeacherCoupons, protected: true },
    messages: { component: Messages, protected: true },
    teacherdetails: { component: TeacherDetails, protected: true },
    centerdetails: { component: CenterDetails, protected: true },
    studentdashboard: { component: StudentDashboard, protected: true },
    studentassignments: { component: StudentAssignments, protected: true },
    admindashboard: { component: AdminDashboard, protected: true },
    chat: { component: Chat, protected: true },
    videosession: { component: VideoSession, protected: true },
    completeprofile: { component: CompleteProfile, protected: true },
    enrollgroup: { component: EnrollGroup, protected: true },
    educationalservices: { component: EducationalServices, protected: true },
    centeradmindashboard: { component: CenterAdminDashboard, protected: true },
    teacherwallet: { component: TeacherWallet, protected: true },
    teachercalendar: { component: TeacherCalendar, protected: true },
    studentcalendar: { component: StudentCalendar, protected: true },
    groupdetails: { component: GroupDetails, protected: true },
    studentprogress: { component: StudentProgress, protected: true },
    createstudygroup: { component: CreateStudyGroup, protected: true },
};

export const pagesConfig = {
    mainPage: 'home',
    Pages: PAGES,
    Layout: Layout,
};