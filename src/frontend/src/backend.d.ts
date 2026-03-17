import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface RosterEntry {
    staffId: string;
    date: string;
    shiftTiming: string;
    rosterId: string;
    wardAssignment: string;
}
export interface LeaveRequest {
    status: LeaveStatus;
    leaveId: string;
    endDate: string;
    staffId: string;
    submittedAt: bigint;
    leaveType: string;
    startDate: string;
    reason: string;
}
export interface Document {
    title: string;
    content: string;
    staffId: string;
    verificationId: string;
    documentId: string;
    issuedAt: bigint;
    issuedBy: string;
}
export interface StaffProfile {
    name: string;
    designation: string;
    role: UserRole;
    employeeId: string;
    department: string;
}
export interface Notice {
    title: string;
    content: string;
    publishedAt: bigint;
    publishedBy: string;
    category: NoticeCategory;
    noticeId: string;
}
export interface UserProfile {
    name: string;
    employeeId: string;
}
export enum LeaveStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum NoticeCategory {
    circular = "circular",
    memo = "memo",
    policy = "policy"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignShift(entry: RosterEntry): Promise<void>;
    createDocument(document: Document): Promise<void>;
    createStaffProfile(profile: StaffProfile): Promise<void>;
    deleteDocument(documentId: string): Promise<void>;
    deleteLeaveRequest(leaveId: string): Promise<void>;
    deleteNotice(noticeId: string): Promise<void>;
    deleteRosterEntry(rosterId: string): Promise<void>;
    deleteStaffProfile(employeeId: string): Promise<void>;
    getAllDocuments(): Promise<Array<Document>>;
    getAllLeaveRequests(): Promise<Array<LeaveRequest>>;
    getAllNotices(): Promise<Array<Notice>>;
    getAllRosters(): Promise<Array<RosterEntry>>;
    getAllStaff(): Promise<Array<StaffProfile>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDocument(documentId: string): Promise<Document | null>;
    getLeaveRequest(leaveId: string): Promise<LeaveRequest | null>;
    getNotice(noticeId: string): Promise<Notice | null>;
    getRosterEntry(rosterId: string): Promise<RosterEntry | null>;
    getStaffDocuments(staffId: string): Promise<Array<Document>>;
    getStaffLeaveRequests(staffId: string): Promise<Array<LeaveRequest>>;
    getStaffProfile(employeeId: string): Promise<StaffProfile | null>;
    getStaffRosterEntries(staffId: string): Promise<Array<RosterEntry>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    publishNotice(notice: Notice): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    submitLeaveRequest(request: LeaveRequest): Promise<void>;
    updateLeaveStatus(leaveId: string, status: LeaveStatus): Promise<void>;
    updateNotice(notice: Notice): Promise<void>;
    updateRosterEntry(entry: RosterEntry): Promise<void>;
    updateStaffProfile(profile: StaffProfile): Promise<void>;
    verifyDocument(verificationId: string): Promise<Document | null>;
}
