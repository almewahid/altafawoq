import Layout from "./Layout.jsx";

import Home from "./Home";

import Browse from "./Browse";

import TeacherDashboard from "./TeacherDashboard";

import TeacherGroups from "./TeacherGroups";

import TeacherCoupons from "./TeacherCoupons";

import Messages from "./Messages";

import TeacherDetails from "./TeacherDetails";

import CenterDetails from "./CenterDetails";

import StudentDashboard from "./StudentDashboard";

import StudentAssignments from "./StudentAssignments";

import AdminDashboard from "./AdminDashboard";

import Chat from "./Chat";

import VideoSession from "./VideoSession";

import CompleteProfile from "./CompleteProfile";

import EnrollGroup from "./EnrollGroup";

import EducationalServices from "./EducationalServices";

import CenterAdminDashboard from "./CenterAdminDashboard";

import TeacherWallet from "./TeacherWallet";

import TeacherCalendar from "./TeacherCalendar";

import StudentCalendar from "./StudentCalendar";

import GroupDetails from "./GroupDetails";

import StudentProgress from "./StudentProgress";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Home: Home,
    
    Browse: Browse,
    
    TeacherDashboard: TeacherDashboard,
    
    TeacherGroups: TeacherGroups,
    
    TeacherCoupons: TeacherCoupons,
    
    Messages: Messages,
    
    TeacherDetails: TeacherDetails,
    
    CenterDetails: CenterDetails,
    
    StudentDashboard: StudentDashboard,
    
    StudentAssignments: StudentAssignments,
    
    AdminDashboard: AdminDashboard,
    
    Chat: Chat,
    
    VideoSession: VideoSession,
    
    CompleteProfile: CompleteProfile,
    
    EnrollGroup: EnrollGroup,
    
    EducationalServices: EducationalServices,
    
    CenterAdminDashboard: CenterAdminDashboard,
    
    TeacherWallet: TeacherWallet,
    
    TeacherCalendar: TeacherCalendar,
    
    StudentCalendar: StudentCalendar,
    
    GroupDetails: GroupDetails,
    
    StudentProgress: StudentProgress,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Home />} />
                
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/Browse" element={<Browse />} />
                
                <Route path="/TeacherDashboard" element={<TeacherDashboard />} />
                
                <Route path="/TeacherGroups" element={<TeacherGroups />} />
                
                <Route path="/TeacherCoupons" element={<TeacherCoupons />} />
                
                <Route path="/Messages" element={<Messages />} />
                
                <Route path="/TeacherDetails" element={<TeacherDetails />} />
                
                <Route path="/CenterDetails" element={<CenterDetails />} />
                
                <Route path="/StudentDashboard" element={<StudentDashboard />} />
                
                <Route path="/StudentAssignments" element={<StudentAssignments />} />
                
                <Route path="/AdminDashboard" element={<AdminDashboard />} />
                
                <Route path="/Chat" element={<Chat />} />
                
                <Route path="/VideoSession" element={<VideoSession />} />
                
                <Route path="/CompleteProfile" element={<CompleteProfile />} />
                
                <Route path="/EnrollGroup" element={<EnrollGroup />} />
                
                <Route path="/EducationalServices" element={<EducationalServices />} />
                
                <Route path="/CenterAdminDashboard" element={<CenterAdminDashboard />} />
                
                <Route path="/TeacherWallet" element={<TeacherWallet />} />
                
                <Route path="/TeacherCalendar" element={<TeacherCalendar />} />
                
                <Route path="/StudentCalendar" element={<StudentCalendar />} />
                
                <Route path="/GroupDetails" element={<GroupDetails />} />
                
                <Route path="/StudentProgress" element={<StudentProgress />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}