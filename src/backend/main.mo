import Map "mo:core/Map";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Mix in the authorization logic
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // TYPES
  type UserRole = AccessControl.UserRole;

  public type UserProfile = {
    name : Text;
    employeeId : Text;
  };

  type StaffProfile = {
    employeeId : Text;
    name : Text;
    department : Text;
    designation : Text;
    role : UserRole;
  };

  type RosterEntry = {
    rosterId : Text;
    staffId : Text;
    date : Text;
    shiftTiming : Text;
    wardAssignment : Text;
  };

  type Notice = {
    noticeId : Text;
    title : Text;
    content : Text;
    category : NoticeCategory;
    publishedAt : Int;
    publishedBy : Text;
  };

  type NoticeCategory = {
    #memo;
    #circular;
    #policy;
  };

  type LeaveRequest = {
    leaveId : Text;
    staffId : Text;
    leaveType : Text;
    startDate : Text;
    endDate : Text;
    reason : Text;
    status : LeaveStatus;
    submittedAt : Int;
  };

  type LeaveStatus = {
    #pending;
    #approved;
    #rejected;
  };

  type Document = {
    documentId : Text;
    staffId : Text;
    title : Text;
    content : Text;
    issuedAt : Int;
    verificationId : Text;
    issuedBy : Text;
  };

  // DATA STORAGE
  let userProfiles = Map.empty<Principal, UserProfile>();
  let staffProfiles = Map.empty<Text, StaffProfile>();
  let rosterEntries = Map.empty<Text, RosterEntry>();
  let notices = Map.empty<Text, Notice>();
  let leaveRequests = Map.empty<Text, LeaveRequest>();
  let documents = Map.empty<Text, Document>();

  // USER PROFILE MANAGEMENT (Required by frontend)
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // HELPER FUNCTION - Get employeeId for caller
  private func getCallerEmployeeId(caller : Principal) : ?Text {
    switch (userProfiles.get(caller)) {
      case (null) { null };
      case (?profile) { ?profile.employeeId };
    };
  };

  // STAFF DIRECTORY
  public shared ({ caller }) func createStaffProfile(profile : StaffProfile) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can create staff profiles");
    };

    if (staffProfiles.containsKey(profile.employeeId)) {
      Runtime.trap("Employee ID already exists");
    };

    staffProfiles.add(profile.employeeId, profile);
  };

  public query ({ caller }) func getStaffProfile(employeeId : Text) : async ?StaffProfile {
    // Staff can only view their own profile, admins can view any
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      switch (getCallerEmployeeId(caller)) {
        case (null) { Runtime.trap("Unauthorized: User profile not found") };
        case (?callerEmployeeId) {
          if (callerEmployeeId != employeeId) {
            Runtime.trap("Unauthorized: Can only view your own profile");
          };
        };
      };
    };
    staffProfiles.get(employeeId);
  };

  public shared ({ caller }) func updateStaffProfile(profile : StaffProfile) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update staff profiles");
    };

    if (not staffProfiles.containsKey(profile.employeeId)) {
      Runtime.trap("Profile does not exist");
    };

    staffProfiles.add(profile.employeeId, profile);
  };

  public shared ({ caller }) func deleteStaffProfile(employeeId : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete staff profiles");
    };

    staffProfiles.remove(employeeId);
  };

  public query ({ caller }) func getAllStaff() : async [StaffProfile] {
    // Only admins can view all staff
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all staff");
    };
    staffProfiles.values().toArray();
  };

  // DUTY ROSTER
  public shared ({ caller }) func assignShift(entry : RosterEntry) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can assign shifts");
    };

    rosterEntries.add(entry.rosterId, entry);
  };

  public query ({ caller }) func getRosterEntry(rosterId : Text) : async ?RosterEntry {
    let entry = rosterEntries.get(rosterId);
    
    // Staff can only view their own roster entries
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      switch (entry) {
        case (null) { return null };
        case (?e) {
          switch (getCallerEmployeeId(caller)) {
            case (null) { Runtime.trap("Unauthorized: User profile not found") };
            case (?callerEmployeeId) {
              if (e.staffId != callerEmployeeId) {
                Runtime.trap("Unauthorized: Can only view your own roster entries");
              };
            };
          };
        };
      };
    };
    
    entry;
  };

  public query ({ caller }) func getStaffRosterEntries(staffId : Text) : async [RosterEntry] {
    // Staff can only query their own roster entries
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      switch (getCallerEmployeeId(caller)) {
        case (null) { Runtime.trap("Unauthorized: User profile not found") };
        case (?callerEmployeeId) {
          if (callerEmployeeId != staffId) {
            Runtime.trap("Unauthorized: Can only view your own roster entries");
          };
        };
      };
    };
    
    rosterEntries.values().toArray().filter(
      func(entry) { entry.staffId == staffId }
    );
  };

  public query ({ caller }) func getAllRosters() : async [RosterEntry] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all roster entries");
    };
    rosterEntries.values().toArray();
  };

  public shared ({ caller }) func updateRosterEntry(entry : RosterEntry) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update roster entries");
    };

    if (not rosterEntries.containsKey(entry.rosterId)) {
      Runtime.trap("Roster entry does not exist");
    };

    rosterEntries.add(entry.rosterId, entry);
  };

  public shared ({ caller }) func deleteRosterEntry(rosterId : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete roster entries");
    };

    rosterEntries.remove(rosterId);
  };

  // NOTICES
  public shared ({ caller }) func publishNotice(notice : Notice) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can publish notices");
    };

    notices.add(notice.noticeId, notice);
  };

  public query ({ caller }) func getNotice(noticeId : Text) : async ?Notice {
    // All authenticated users can view notices
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view notices");
    };
    notices.get(noticeId);
  };

  public query ({ caller }) func getAllNotices() : async [Notice] {
    // All authenticated users can view notices
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view notices");
    };
    notices.values().toArray();
  };

  public shared ({ caller }) func updateNotice(notice : Notice) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update notices");
    };

    if (not notices.containsKey(notice.noticeId)) {
      Runtime.trap("Notice does not exist");
    };

    notices.add(notice.noticeId, notice);
  };

  public shared ({ caller }) func deleteNotice(noticeId : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete notices");
    };

    notices.remove(noticeId);
  };

  // LEAVE MANAGEMENT
  public shared ({ caller }) func submitLeaveRequest(request : LeaveRequest) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only staff can submit leave requests");
    };

    // Verify that the staff is submitting their own leave request
    switch (getCallerEmployeeId(caller)) {
      case (null) { Runtime.trap("Unauthorized: User profile not found") };
      case (?callerEmployeeId) {
        if (request.staffId != callerEmployeeId) {
          Runtime.trap("Unauthorized: Can only submit leave requests for yourself");
        };
      };
    };

    leaveRequests.add(request.leaveId, request);
  };

  public query ({ caller }) func getLeaveRequest(leaveId : Text) : async ?LeaveRequest {
    let request = leaveRequests.get(leaveId);
    
    // Staff can only view their own leave requests
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      switch (request) {
        case (null) { return null };
        case (?r) {
          switch (getCallerEmployeeId(caller)) {
            case (null) { Runtime.trap("Unauthorized: User profile not found") };
            case (?callerEmployeeId) {
              if (r.staffId != callerEmployeeId) {
                Runtime.trap("Unauthorized: Can only view your own leave requests");
              };
            };
          };
        };
      };
    };
    
    request;
  };

  public query ({ caller }) func getStaffLeaveRequests(staffId : Text) : async [LeaveRequest] {
    // Staff can only query their own leave requests
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      switch (getCallerEmployeeId(caller)) {
        case (null) { Runtime.trap("Unauthorized: User profile not found") };
        case (?callerEmployeeId) {
          if (callerEmployeeId != staffId) {
            Runtime.trap("Unauthorized: Can only view your own leave requests");
          };
        };
      };
    };
    
    leaveRequests.values().toArray().filter(
      func(request) { request.staffId == staffId }
    );
  };

  public query ({ caller }) func getAllLeaveRequests() : async [LeaveRequest] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all leave requests");
    };
    leaveRequests.values().toArray();
  };

  public shared ({ caller }) func updateLeaveStatus(leaveId : Text, status : LeaveStatus) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update leave status");
    };

    switch (leaveRequests.get(leaveId)) {
      case (null) { Runtime.trap("Leave request does not exist") };
      case (?request) {
        let updated : LeaveRequest = {
          leaveId = request.leaveId;
          staffId = request.staffId;
          leaveType = request.leaveType;
          startDate = request.startDate;
          endDate = request.endDate;
          reason = request.reason;
          status;
          submittedAt = request.submittedAt;
        };
        leaveRequests.add(leaveId, updated);
      };
    };
  };

  public shared ({ caller }) func deleteLeaveRequest(leaveId : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete leave requests");
    };
    leaveRequests.remove(leaveId);
  };

  // DOCUMENT VAULT
  public shared ({ caller }) func createDocument(document : Document) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can create documents");
    };

    documents.add(document.documentId, document);
  };

  public query ({ caller }) func getDocument(documentId : Text) : async ?Document {
    let document = documents.get(documentId);
    
    // Staff can only view their own documents
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      switch (document) {
        case (null) { return null };
        case (?doc) {
          switch (getCallerEmployeeId(caller)) {
            case (null) { Runtime.trap("Unauthorized: User profile not found") };
            case (?callerEmployeeId) {
              if (doc.staffId != callerEmployeeId) {
                Runtime.trap("Unauthorized: Can only view your own documents");
              };
            };
          };
        };
      };
    };
    
    document;
  };

  public query ({ caller }) func getStaffDocuments(staffId : Text) : async [Document] {
    // Staff can only query their own documents
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      switch (getCallerEmployeeId(caller)) {
        case (null) { Runtime.trap("Unauthorized: User profile not found") };
        case (?callerEmployeeId) {
          if (callerEmployeeId != staffId) {
            Runtime.trap("Unauthorized: Can only view your own documents");
          };
        };
      };
    };
    
    documents.values().toArray().filter(
      func(document) { document.staffId == staffId }
    );
  };

  public query ({ caller }) func getAllDocuments() : async [Document] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all documents");
    };
    documents.values().toArray();
  };

  public shared ({ caller }) func deleteDocument(documentId : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete documents");
    };
    documents.remove(documentId);
  };

  // HELPER - DOCUMENT VERIFICATION
  public query ({ caller }) func verifyDocument(verificationId : Text) : async ?Document {
    // Document verification is public (no auth check) for external verification
    documents.values().find(
      func(document) { document.verificationId == verificationId }
    );
  };
};
