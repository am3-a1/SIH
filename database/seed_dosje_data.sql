-- ============================================================================
-- SIH26095: Seed Data for DoSJE Welfare Institutions & MoSJE Schemes
-- ============================================================================

-- Seed Users with RBAC Roles
INSERT INTO users (id, username, password_hash, full_name, email, phone, role, designation, state, district)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'admin_director', 'sha256_hashed_pwd', 'Dr. Rajesh Sharma', 'director.pmu@dosje.gov.in', '+91-11-23381234', 'NATIONAL_ADMIN', 'Joint Secretary & Director PMU', 'ALL', 'ALL'),
    ('22222222-2222-2222-2222-222222222222', 'state_officer_pb', 'sha256_hashed_pwd', 'Gurpreet Singh', 'welfare.pb@punjab.gov.in', '+91-172-2740011', 'STATE_OFFICER', 'Director Social Welfare Punjab', 'Punjab', 'ALL'),
    ('33333333-3333-3333-3333-333333333333', 'inspector_delhi', 'sha256_hashed_pwd', 'Sunita Rao', 'inspector.delhi@dosje.gov.in', '+91-9810123456', 'DISTRICT_INSPECTOR', 'Senior Field Inspection Officer', 'Delhi', 'New Delhi'),
    ('44444444-4444-4444-4444-444444444444', 'auditor_flying_squad', 'sha256_hashed_pwd', 'Vikramaditya Roy', 'audit.squad@dosje.gov.in', '+91-9876543210', 'SURPRISE_AUDITOR', 'Chief Vigilance & Surprise Auditor', 'ALL', 'ALL'),
    ('55555555-5555-5555-5555-555555555555', 'ngo_head_snehalaya', 'sha256_hashed_pwd', 'Anil Verma', 'manager@snehalayadelhi.org', '+91-9988776655', 'FACILITY_HEAD', 'Project Director Snehalaya', 'Delhi', 'New Delhi'),
    ('OFFICER-ONSITE-001', 'insp_delhi_rajesh', 'sha256_hashed_pwd', 'Rajesh Nair', 'rajesh.nair@dosje.gov.in', '+91-9810111201', 'DISTRICT_INSPECTOR', 'Senior Field Inspection Officer', 'Delhi', 'New Delhi'),
    ('OFFICER-ONSITE-002', 'insp_pune_priya', 'sha256_hashed_pwd', 'Priya Sen', 'priya.sen@dosje.gov.in', '+91-9820222302', 'DISTRICT_INSPECTOR', 'District Social Welfare Inspector', 'Maharashtra', 'Pune'),
    ('OFFICER-ONSITE-003', 'insp_amritsar_harpreet', 'sha256_hashed_pwd', 'Harpreet Singh Dhillon', 'harpreet.singh@dosje.gov.in', '+91-9830333403', 'DISTRICT_INSPECTOR', 'Vigilance Monitoring Officer', 'Punjab', 'Amritsar'),
    ('OFFICER-ONSITE-004', 'insp_jaipur_amit', 'sha256_hashed_pwd', 'Amit Deshmukh', 'amit.deshmukh@dosje.gov.in', '+91-9840444504', 'DISTRICT_INSPECTOR', 'Senior Field Inspection Officer', 'Rajasthan', 'Jaipur'),
    ('OFFICER-ONSITE-005', 'insp_bengaluru_kavita', 'sha256_hashed_pwd', 'Kavita Iyer', 'kavita.iyer@dosje.gov.in', '+91-9850555605', 'DISTRICT_INSPECTOR', 'District Welfare Officer', 'Karnataka', 'Bengaluru'),
    ('OFFICER-ONSITE-006', 'insp_lucknow_alok', 'sha256_hashed_pwd', 'Alok Srivastava', 'alok.sri@dosje.gov.in', '+91-9860666706', 'DISTRICT_INSPECTOR', 'Onsite Compliance Officer', 'Uttar Pradesh', 'Lucknow'),
    ('OFFICER-ONSITE-007', 'insp_kolkata_ananya', 'sha256_hashed_pwd', 'Ananya Dasgupta', 'ananya.das@dosje.gov.in', '+91-9870777807', 'DISTRICT_INSPECTOR', 'Senior Field Inspection Officer', 'West Bengal', 'Kolkata'),
    ('OFFICER-ONSITE-008', 'insp_bhopal_mohammed', 'sha256_hashed_pwd', 'Mohammed Farooq', 'mohammed.farooq@dosje.gov.in', '+91-9880888908', 'DISTRICT_INSPECTOR', 'District Social Welfare Inspector', 'Madhya Pradesh', 'Bhopal'),
    ('OFFICER-ONSITE-009', 'insp_mumbai_suresh', 'sha256_hashed_pwd', 'Suresh Patel', 'suresh.patel@dosje.gov.in', '+91-9890999009', 'DISTRICT_INSPECTOR', 'Flying Squad Auditor', 'Maharashtra', 'Mumbai'),
    ('OFFICER-ONSITE-010', 'insp_varanasi_neha', 'sha256_hashed_pwd', 'Neha Agarwal', 'neha.agarwal@dosje.gov.in', '+91-9810123410', 'DISTRICT_INSPECTOR', 'Onsite Compliance Officer', 'Uttar Pradesh', 'Varanasi'),
    ('OFFICER-ONSITE-011', 'insp_hyd_kalyan', 'sha256_hashed_pwd', 'Kalyan Ram', 'kalyan.ram@dosje.gov.in', '+91-9820234511', 'DISTRICT_INSPECTOR', 'Vigilance Monitoring Officer', 'Telangana', 'Secunderabad'),
    ('OFFICER-ONSITE-012', 'insp_imphal_thoiba', 'sha256_hashed_pwd', 'Thoiba Meitei', 'thoiba.meitei@dosje.gov.in', '+91-9830345612', 'DISTRICT_INSPECTOR', 'Senior Field Inspection Officer', 'Manipur', 'Imphal'),
    ('OFFICER-ONSITE-013', 'insp_chennai_meenakshi', 'sha256_hashed_pwd', 'Meenakshi Sundaram', 'meenakshi.s@dosje.gov.in', '+91-9840456713', 'DISTRICT_INSPECTOR', 'District Welfare Officer', 'Tamil Nadu', 'Chennai'),
    ('OFFICER-ONSITE-014', 'insp_patna_ramesh', 'sha256_hashed_pwd', 'Ramesh Kumar Verma', 'ramesh.verma@dosje.gov.in', '+91-9850567814', 'DISTRICT_INSPECTOR', 'Senior Field Inspection Officer', 'Bihar', 'Patna'),
    ('OFFICER-ONSITE-015', 'insp_ahmedabad_bhavin', 'sha256_hashed_pwd', 'Bhavin Shah', 'bhavin.shah@dosje.gov.in', '+91-9860678915', 'DISTRICT_INSPECTOR', 'District Social Welfare Inspector', 'Gujarat', 'Ahmedabad'),
    ('OFFICER-ONSITE-016', 'insp_kochi_divya', 'sha256_hashed_pwd', 'Divya Menon', 'divya.menon@dosje.gov.in', '+91-9870789016', 'DISTRICT_INSPECTOR', 'Onsite Compliance Officer', 'Kerala', 'Ernakulam'),
    ('OFFICER-ONSITE-017', 'insp_bhubaneswar_sanjay', 'sha256_hashed_pwd', 'Sanjay Mohanty', 'sanjay.mohanty@dosje.gov.in', '+91-9880890117', 'DISTRICT_INSPECTOR', 'Senior Field Inspection Officer', 'Odisha', 'Bhubaneswar'),
    ('OFFICER-ONSITE-018', 'insp_guwahati_pranab', 'sha256_hashed_pwd', 'Pranab Barua', 'pranab.barua@dosje.gov.in', '+91-9890901218', 'DISTRICT_INSPECTOR', 'Flying Squad Auditor', 'Assam', 'Guwahati'),
    ('OFFICER-ONSITE-019', 'insp_chandigarh_jaspreet', 'sha256_hashed_pwd', 'Jaspreet Kaur', 'jaspreet.kaur@dosje.gov.in', '+91-9810134519', 'DISTRICT_INSPECTOR', 'District Welfare Officer', 'Punjab', 'Chandigarh'),
    ('OFFICER-ONSITE-020', 'insp_ranchi_deepak', 'sha256_hashed_pwd', 'Deepak Oraon', 'deepak.oraon@dosje.gov.in', '+91-9820245620', 'DISTRICT_INSPECTOR', 'Vigilance Monitoring Officer', 'Jharkhand', 'Ranchi'),
    ('OFFICER-ONSITE-021', 'insp_dehradun_pooja', 'sha256_hashed_pwd', 'Pooja Rawat', 'pooja.rawat@dosje.gov.in', '+91-9830356721', 'DISTRICT_INSPECTOR', 'Senior Field Inspection Officer', 'Uttarakhand', 'Dehradun'),
    ('OFFICER-ONSITE-022', 'insp_shimla_rohit', 'sha256_hashed_pwd', 'Rohit Thakur', 'rohit.thakur@dosje.gov.in', '+91-9840467822', 'DISTRICT_INSPECTOR', 'Onsite Compliance Officer', 'Himachal Pradesh', 'Shimla'),
    ('OFFICER-ONSITE-023', 'insp_srinagar_tariq', 'sha256_hashed_pwd', 'Tariq Ahmad Bhat', 'tariq.bhat@dosje.gov.in', '+91-9850578923', 'DISTRICT_INSPECTOR', 'District Social Welfare Inspector', 'Jammu and Kashmir', 'Srinagar'),
    ('OFFICER-ONSITE-024', 'insp_raipur_manish', 'sha256_hashed_pwd', 'Manish Baghel', 'manish.baghel@dosje.gov.in', '+91-9860689024', 'DISTRICT_INSPECTOR', 'Senior Field Inspection Officer', 'Chhattisgarh', 'Raipur'),
    ('OFFICER-ONSITE-025', 'insp_panaji_ashwin', 'sha256_hashed_pwd', 'Ashwin Kamat', 'ashwin.kamat@dosje.gov.in', '+91-9870790125', 'DISTRICT_INSPECTOR', 'District Welfare Officer', 'Goa', 'North Goa'),
    ('OFFICER-ONSITE-026', 'insp_surat_hetal', 'sha256_hashed_pwd', 'Hetal Desai', 'hetal.desai@dosje.gov.in', '+91-9880801226', 'DISTRICT_INSPECTOR', 'Vigilance Monitoring Officer', 'Gujarat', 'Surat'),
    ('OFFICER-ONSITE-027', 'insp_nagpur_nitin', 'sha256_hashed_pwd', 'Nitin Gadgil', 'nitin.gadgil@dosje.gov.in', '+91-9890912327', 'DISTRICT_INSPECTOR', 'Flying Squad Auditor', 'Maharashtra', 'Nagpur'),
    ('OFFICER-ONSITE-028', 'insp_indore_swati', 'sha256_hashed_pwd', 'Swati Joshi', 'swati.joshi@dosje.gov.in', '+91-9810145628', 'DISTRICT_INSPECTOR', 'Senior Field Inspection Officer', 'Madhya Pradesh', 'Indore'),
    ('OFFICER-ONSITE-029', 'insp_kanpur_arun', 'sha256_hashed_pwd', 'Arun Tripathi', 'arun.tripathi@dosje.gov.in', '+91-9820256729', 'DISTRICT_INSPECTOR', 'Onsite Compliance Officer', 'Uttar Pradesh', 'Kanpur'),
    ('OFFICER-ONSITE-030', 'insp_agra_rekha', 'sha256_hashed_pwd', 'Rekha Yadav', 'rekha.yadav@dosje.gov.in', '+91-9830367830', 'DISTRICT_INSPECTOR', 'District Social Welfare Inspector', 'Uttar Pradesh', 'Agra'),
    ('OFFICER-ONSITE-031', 'insp_jodhpur_vijay', 'sha256_hashed_pwd', 'Vijay Rathore', 'vijay.rathore@dosje.gov.in', '+91-9840478931', 'DISTRICT_INSPECTOR', 'Senior Field Inspection Officer', 'Rajasthan', 'Jodhpur'),
    ('OFFICER-ONSITE-032', 'insp_ludhiana_manpreet', 'sha256_hashed_pwd', 'Manpreet Grewal', 'manpreet.grewal@dosje.gov.in', '+91-9850589032', 'DISTRICT_INSPECTOR', 'District Welfare Officer', 'Punjab', 'Ludhiana'),
    ('OFFICER-ONSITE-033', 'insp_jalandhar_balraj', 'sha256_hashed_pwd', 'Balraj Sahni', 'balraj.sahni@dosje.gov.in', '+91-9860690133', 'DISTRICT_INSPECTOR', 'Vigilance Monitoring Officer', 'Punjab', 'Jalandhar'),
    ('OFFICER-ONSITE-034', 'insp_mysuru_shweta', 'sha256_hashed_pwd', 'Shweta Hegde', 'shweta.hegde@dosje.gov.in', '+91-9870701234', 'DISTRICT_INSPECTOR', 'Senior Field Inspection Officer', 'Karnataka', 'Mysuru'),
    ('OFFICER-ONSITE-035', 'insp_mangaluru_naveen', 'sha256_hashed_pwd', 'Naveen Shetty', 'naveen.shetty@dosje.gov.in', '+91-9880812335', 'DISTRICT_INSPECTOR', 'Onsite Compliance Officer', 'Karnataka', 'Dakshina Kannada'),
    ('OFFICER-ONSITE-036', 'insp_coimbatore_karthik', 'sha256_hashed_pwd', 'Karthik Subramanian', 'karthik.s@dosje.gov.in', '+91-9890923436', 'DISTRICT_INSPECTOR', 'District Social Welfare Inspector', 'Tamil Nadu', 'Coimbatore'),
    ('OFFICER-ONSITE-037', 'insp_madurai_revathi', 'sha256_hashed_pwd', 'Revathi Natarajan', 'revathi.n@dosje.gov.in', '+91-9810156737', 'DISTRICT_INSPECTOR', 'Senior Field Inspection Officer', 'Tamil Nadu', 'Madurai'),
    ('OFFICER-ONSITE-038', 'insp_vizag_venkat', 'sha256_hashed_pwd', 'Venkat Rao', 'venkat.rao@dosje.gov.in', '+91-9820267838', 'DISTRICT_INSPECTOR', 'Flying Squad Auditor', 'Andhra Pradesh', 'Visakhapatnam'),
    ('OFFICER-ONSITE-039', 'insp_vijayawada_lakshmi', 'sha256_hashed_pwd', 'Lakshmi Prasanna', 'lakshmi.p@dosje.gov.in', '+91-9830378939', 'DISTRICT_INSPECTOR', 'District Welfare Officer', 'Andhra Pradesh', 'Krishna'),
    ('OFFICER-ONSITE-040', 'insp_thiruvananthapuram_arun', 'sha256_hashed_pwd', 'Arun Varma', 'arun.varma@dosje.gov.in', '+91-9840489040', 'DISTRICT_INSPECTOR', 'Vigilance Monitoring Officer', 'Kerala', 'Thiruvananthapuram'),
    ('OFFICER-ONSITE-041', 'insp_kozhikode_fathima', 'sha256_hashed_pwd', 'Fathima Zahra', 'fathima.zahra@dosje.gov.in', '+91-9850590141', 'DISTRICT_INSPECTOR', 'Senior Field Inspection Officer', 'Kerala', 'Kozhikode'),
    ('OFFICER-ONSITE-042', 'insp_cuttack_soumya', 'sha256_hashed_pwd', 'Soumya Ranjan Das', 'soumya.das@dosje.gov.in', '+91-9860601242', 'DISTRICT_INSPECTOR', 'Onsite Compliance Officer', 'Odisha', 'Cuttack'),
    ('OFFICER-ONSITE-043', 'insp_silchar_sudip', 'sha256_hashed_pwd', 'Sudip Roy Choudhury', 'sudip.roy@dosje.gov.in', '+91-9870712343', 'DISTRICT_INSPECTOR', 'District Social Welfare Inspector', 'Assam', 'Cachar'),
    ('OFFICER-ONSITE-044', 'insp_agartala_biplab', 'sha256_hashed_pwd', 'Biplab Debbarma', 'biplab.d@dosje.gov.in', '+91-9880823444', 'DISTRICT_INSPECTOR', 'Senior Field Inspection Officer', 'Tripura', 'West Tripura'),
    ('OFFICER-ONSITE-045', 'insp_shillong_wankerlang', 'sha256_hashed_pwd', 'Wankerlang Lyngdoh', 'wanker.lyngdoh@dosje.gov.in', '+91-9890934545', 'DISTRICT_INSPECTOR', 'Flying Squad Auditor', 'Meghalaya', 'East Khasi Hills'),
    ('OFFICER-ONSITE-046', 'insp_aizawl_lalrinsanga', 'sha256_hashed_pwd', 'Lalrinsanga Sailo', 'lalrin.sailo@dosje.gov.in', '+91-9810167846', 'DISTRICT_INSPECTOR', 'District Welfare Officer', 'Mizoram', 'Aizawl'),
    ('OFFICER-ONSITE-047', 'insp_kohima_temjen', 'sha256_hashed_pwd', 'Temjen Jamir', 'temjen.jamir@dosje.gov.in', '+91-9820278947', 'DISTRICT_INSPECTOR', 'Vigilance Monitoring Officer', 'Nagaland', 'Kohima'),
    ('OFFICER-ONSITE-048', 'insp_gangtok_tshering', 'sha256_hashed_pwd', 'Tshering Lepcha', 'tshering.lepcha@dosje.gov.in', '+91-9830389048', 'DISTRICT_INSPECTOR', 'Senior Field Inspection Officer', 'Sikkim', 'East Sikkim'),
    ('OFFICER-ONSITE-049', 'insp_itanagar_taba', 'sha256_hashed_pwd', 'Taba Taku', 'taba.taku@dosje.gov.in', '+91-9840490149', 'DISTRICT_INSPECTOR', 'Onsite Compliance Officer', 'Arunachal Pradesh', 'Papum Pare'),
    ('OFFICER-ONSITE-050', 'insp_portblair_anand', 'sha256_hashed_pwd', 'Anand Swaroop', 'anand.swaroop@dosje.gov.in', '+91-9850501250', 'DISTRICT_INSPECTOR', 'District Social Welfare Inspector', 'Andaman and Nicobar', 'South Andaman')
ON CONFLICT (id) DO NOTHING;

-- Seed Facilities with PostGIS GPS Geometries
INSERT INTO facilities (id, name, scheme_code, scheme_name, organization_name, in_charge_name, contact_phone, contact_email, address, district, state, pincode, geom, latitude, longitude, geofence_radius_meters, sanctioned_capacity, enrolled_beneficiaries, compliance_grade, risk_score)
VALUES
    ('DOSJE-DL-001', 'Snehalaya Senior Citizens Home', 'AVYAY', 'Atal Vayo Abhyuday Yojana', 'HelpAge India Trust', 'Anil Verma', '+91-11-26549870', 'info@snehalayadelhi.org', 'Sector 4, R.K. Puram', 'New Delhi', 'Delhi', '110022', ST_SetSRID(ST_MakePoint(77.1734, 28.5672), 4326), 28.5672, 77.1734, 150, 100, 88, 'A', 18),
    
    ('DOSJE-PB-002', 'Nasha Mukti Punarvas Kendra (IRCA)', 'NAPDDR', 'National Action Plan for Drug Demand Reduction', 'Red Cross Society Punjab', 'Dr. Jaswant Brar', '+91-183-2211456', 'amritsar.irca@redcross.org', 'Circular Road, Near Civil Hospital', 'Amritsar', 'Punjab', '143001', ST_SetSRID(ST_MakePoint(74.8723, 31.6340), 4326), 31.6340, 74.8723, 120, 60, 42, 'C', 86),
    
    ('DOSJE-MH-003', 'Savitribai Phule SC Girls Residential Hostel', 'PM-AJAY', 'Pradhan Mantri Anusuchit Jaati Abhyuday Yojana', 'Maharashtra Social Welfare Dept', 'Meenakshi Patil', '+91-20-25658912', 'hostel.scgirls@pune.gov.in', 'Ganeshkhind Road, Shivaji Nagar', 'Pune', 'Maharashtra', '411005', ST_SetSRID(ST_MakePoint(73.8567, 18.5204), 4326), 18.5204, 73.8567, 200, 150, 142, 'A', 24),
    
    ('DOSJE-WB-004', 'Garima Greh Shelter & Livelihood Center', 'SMILE', 'Support for Marginalized Individuals (Transgender Persons)', 'Pratyay Gender Trust', 'Rani Mukherjee', '+91-33-24128900', 'garimagreh.kolkata@pratyay.org', '8/1 Prince Anwar Shah Road', 'Kolkata', 'West Bengal', '700033', ST_SetSRID(ST_MakePoint(88.3639, 22.5726), 4326), 22.5726, 88.3639, 100, 40, 36, 'A', 15),
    
    ('DOSJE-UP-005', 'Divyangjan Composite Regional Rehabilitation Centre', 'DIVYANG', 'Assistance to Disabled Persons (ADIP)', 'National Institute of Disabilities', 'Dr. Alok Srivastava', '+91-522-2789123', 'crc.lucknow@gov.in', 'Sector C, Mahanagar', 'Lucknow', 'Uttar Pradesh', '226006', ST_SetSRID(ST_MakePoint(80.9462, 26.8467), 4326), 26.8467, 80.9462, 180, 120, 95, 'B', 38),
    
    ('DOSJE-MN-006', 'Youth De-addiction & Hope Center', 'NAPDDR', 'National Action Plan for Drug Demand Reduction', 'Kripa Foundation Northeast', 'Thoiba Singh', '+91-385-2445678', 'kripa.imphal@kripafoundation.org', 'Lamphelpat, Near DC Office', 'Imphal', 'Manipur', '795004', ST_SetSRID(ST_MakePoint(93.9368, 24.8170), 4326), 24.8170, 93.9368, 120, 50, 31, 'C', 79),
    
    ('DOSJE-RJ-007', 'Atal Vayo Senior Care Sanctuary', 'AVYAY', 'Atal Vayo Abhyuday Yojana', 'Rajasthan Jan Seva Samiti', 'Mahesh Pareek', '+91-141-2704321', 'vayo.care@jansevajaipur.org', 'Malviya Nagar, Sector 3', 'Jaipur', 'Rajasthan', '302017', ST_SetSRID(ST_MakePoint(75.7873, 26.9124), 4326), 26.9124, 75.7873, 150, 80, 68, 'B', 62),
    
    ('DOSJE-KA-008', 'Dr. B.R. Ambedkar SC/ST Polytechnic Hostel', 'PM-AJAY', 'PM Anusuchit Jaati Abhyuday Yojana', 'Karnataka Social Welfare Dept', 'Basavaraj Hiremath', '+91-80-22214356', 'ambedkarhostel.blr@karnataka.gov.in', 'Rajajinagar 1st Block', 'Bengaluru', 'Karnataka', '560010', ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326), 12.9716, 77.5946, 200, 200, 192, 'A', 14),
    
    ('DOSJE-MP-009', 'Nasha Mukt Bharat Rehabilitation Clinic', 'NAPDDR', 'National Action Plan for Drug Demand Reduction', 'Samvedna Welfare Foundation', 'Dr. Pradeep Mishra', '+91-755-2554321', 'bhopal.nmba@samvedna.org', 'Kolar Road, Mandakini Colony', 'Bhopal', 'Madhya Pradesh', '462042', ST_SetSRID(ST_MakePoint(77.4126, 23.2599), 4326), 23.2599, 77.4126, 120, 50, 26, 'CRITICAL', 92),
    
    ('DOSJE-MH-010', 'Garima Greh Transgender Safe Haven', 'SMILE', 'Support for Marginalized Individuals', 'Humsafar Trust', 'Sanjay Sharma', '+91-22-26673200', 'garimagreh@humsafar.org', 'Vakola, Santacruz East', 'Mumbai', 'Maharashtra', '400055', ST_SetSRID(ST_MakePoint(72.8777, 19.0760), 4326), 19.0760, 72.8777, 100, 35, 34, 'A', 19),
    
    ('DOSJE-UP-011', 'Kashi Vridha Ashram Living Care', 'AVYAY', 'Atal Vayo Abhyuday Yojana', 'Varanasi Seva Trust', 'Kalyani Devi', '+91-542-2311222', 'ashram@kashiseva.org', 'Assi Ghat Road, Bhelupur', 'Varanasi', 'Uttar Pradesh', '221005', ST_SetSRID(ST_MakePoint(83.0064, 25.3176), 4326), 25.3176, 83.0064, 150, 90, 75, 'B', 48),
    
    ('DOSJE-TG-012', 'NIEPID National Disability Rehabilitation Hub', 'DIVYANG', 'Assistance to Disabled Persons (ADIP)', 'NIEPID Govt Institute', 'Dr. B. Radhika', '+91-40-27751741', 'director@niepid.nic.in', 'Manovikas Nagar, Bowenpally', 'Secunderabad', 'Telangana', '500009', ST_SetSRID(ST_MakePoint(78.4867, 17.3850), 4326), 17.3850, 78.4867, 250, 220, 214, 'A', 11)
ON CONFLICT (id) DO NOTHING;

-- Seed CCTV Surveillance Cameras
INSERT INTO cctv_cameras (id, facility_id, camera_name, location_tag, onvif_ip, onvif_port, rtsp_url, status, ptz_enabled)
VALUES
    ('CAM-DL01-1', 'DOSJE-DL-001', 'Gate Surveillance Cam 1', 'Main Entrance Gate', '192.168.10.101', 80, 'rtsp://admin:pass@192.168.10.101:554/live/ch0', 'ONLINE', TRUE),
    ('CAM-DL01-2', 'DOSJE-DL-001', 'Dining & Kitchen Cam 2', 'Dining Hall & Kitchen', '192.168.10.102', 80, 'rtsp://admin:pass@192.168.10.102:554/live/ch0', 'ONLINE', TRUE),
    ('CAM-DL01-3', 'DOSJE-DL-001', 'Dormitory East Wing', 'Dormitory Living Area', '192.168.10.103', 80, 'rtsp://admin:pass@192.168.10.103:554/live/ch0', 'ONLINE', FALSE),
    
    ('CAM-PB02-1', 'DOSJE-PB-002', 'IRCA Gate Entry', 'Main Gate', '192.168.20.101', 80, 'rtsp://admin:pass@192.168.20.101:554/live/ch0', 'ONLINE', TRUE),
    ('CAM-PB02-2', 'DOSJE-PB-002', 'Medical & Detox Ward', 'Detoxification Ward', '192.168.20.102', 80, 'rtsp://admin:pass@192.168.20.102:554/live/ch0', 'TAMPERED', FALSE),
    
    ('CAM-MP09-1', 'DOSJE-MP-009', 'Main Corridor Cam', 'Corridor & Reception', '192.168.30.101', 80, 'rtsp://admin:pass@192.168.30.101:554/live/ch0', 'OFFLINE', TRUE),
    ('CAM-MP09-2', 'DOSJE-MP-009', 'Counseling Room', 'Therapy Hall', '192.168.30.102', 80, 'rtsp://admin:pass@192.168.30.102:554/live/ch0', 'OFFLINE', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Seed Sample Active Alerts
INSERT INTO system_alerts (id, facility_id, alert_type, severity, title, description)
VALUES
    ('99999999-1111-1111-1111-111111111111', 'DOSJE-MP-009', 'GHOST_BENEFICIARY', 'CRITICAL', 'Ghost Beneficiary Discrepancy > 48%', 'Registered enrolled strength is 50, but live CCTV and AI head-count scan verified only 26 individuals.'),
    ('99999999-2222-2222-2222-222222222222', 'DOSJE-PB-002', 'CCTV_DOWNTIME', 'HIGH', 'Surveillance Feed Tampered / Offline', 'Medical Ward CCTV feed has been disconnected for 36 consecutive hours. Unannounced inspection required.'),
    ('99999999-3333-3333-3333-333333333333', 'DOSJE-RJ-007', 'POOR_FOOD_QUALITY', 'MEDIUM', 'Food Quality Rating Dropped to 52%', 'Beneficiary feedback questionnaire flagged substandard nutrition during last meal inspection.')
ON CONFLICT (id) DO NOTHING;
