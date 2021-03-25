module.exports = {
 All:['SuperAdmin', 'User', 'Admin', 'Researcher', 'Clinical'],
 Readers:['SuperAdmin', 'Admin', 'Researcher', 'Clinical'],
 AllLessResearcher:['SuperAdmin', 'User', 'Admin', 'Clinical'],
 OnlyUser:['User'],
 OnlyClinical:['Clinical'],
 UserResearcher:['User','Researcher'],
 AdminSuperAdmin:['Admin', 'SuperAdmin'],
 Admin:['Admin'],
 SuperAdmin:['SuperAdmin'],
 UserClinical:['User', 'Clinical'],
 UserClinicalSuperAdmin:['User', 'Clinical', 'SuperAdmin'],
 ClinicalSuperAdmin:['Clinical', 'SuperAdmin'],
}
