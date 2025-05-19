// File: Students.jsx

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { Navbar } from "../../components/ui/Navbar";
import { Sidebar } from "../../components/ui/Sidebar";
import { PORT } from "../../utils/constants";

export function Students() {
  const [students, setStudents] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [yearLevel, setYearLevel] = useState("ALL");
  const [program, setProgram] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm();

  const fetchStudents = async () => {
    try {
      const response = await axios.get(`${PORT}/students`, {
        params: {
          q: searchQuery,
          filterByYearLevel: yearLevel !== "ALL" ? yearLevel : undefined,
          filterByProgram: program !== "ALL" ? program : undefined,
          filterBySchoolTerm: schoolTerm !== "ALL" ? schoolTerm : undefined,
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      setStudents(response.data);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const fetchPrograms = async () => {
    try {
      const response = await axios.get(`${PORT}/programs`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      setPrograms(response.data);
    } catch (error) {
      console.error("Error fetching programs:", error);
    }
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        programId: parseInt(data.programId),
        password: "password",
      };
      if (selectedStudent) {
        // Update existing student
        await axios.patch(`${PORT}/students/${selectedStudent.id}`, payload, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });
      } else {
        // Create new student
        await axios.post(`${PORT}/students`, payload, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });
      }
      setIsModalOpen(false);
      setIsViewModalOpen(false);
      reset();
      fetchStudents();
    } catch (error) {
      console.error("Error saving student:", error);
    }
  };

  const handleDelete = async (studentId) => {
    try {
      const confirmed = window.confirm(
        "Are you sure you want to delete this student?"
      );
      if (!confirmed) return;

      await axios.delete(`${PORT}/students/${studentId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      fetchStudents(); // Refresh the students' list after deletion
      alert("Student deleted successfully!");
    } catch (error) {
      console.error("Error deleting student:", error);
      alert("Failed to delete the student. Please try again.");
    }
  };

  const handleViewDetails = async (student) => {
    try {
      const response = await axios.get(`${PORT}/students/${student.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      setSelectedStudent(response.data);
      setIsViewModalOpen(true);

      // Populate form fields with student data
      for (const [key, value] of Object.entries(response.data)) {
        setValue(key, value);
      }
    } catch (error) {
      console.error("Error fetching student details:", error);
    }
  };

  const handleUpload = async () => {
    if (!csvFile) {
      console.error("No file selected");
      return;
    }

    const formData = new FormData();
    formData.append("file", csvFile);

    try {
      await axios.post(`${PORT}/students/upload`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setIsUploadModalOpen(false);
      setCsvFile(null);
      fetchStudents();
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  // CSV download handler
  const handleDownloadCsv = () => {
    // Build CSV header
    let csv = "Student Name,Student No.,Email,Year Level,Program,Curriculum\n";

    // Append each student as a CSV row
    students.forEach((student) => {
      const studentName = `${student.firstName} ${student.lastName}`;
      const studentNo = student.studentId;
      const email = student.email;
      const year = formatYearLevel(student.yearLevel);
      const course = student.program.code;
      const curriculum =
        student.studentCourse[0]?.course.curriculum.code || "None";

      // Wrap fields in quotes and separate by commas
      csv += `"${studentName}","${studentNo}","${email}","${year}","${course}","${curriculum}"\n`;
    });

    // Create a Blob from the CSV string and create a temporary download link
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "students.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const [schoolTerms, setSchoolTerms] = useState([]);
  const [schoolTerm, setSchoolTerm] = useState("ALL");
  const [schoolTermModalOpen, setSchoolTermModalOpen] = useState(false);
  const [selectedSchoolTerm, setSelectedSchoolTerm] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);

  const fetchSchoolTerms = async () => {
    try {
      const response = await axios.get(`${PORT}/school-terms`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      setSchoolTerms(response.data);
    } catch (error) {
      console.error("Error fetching school terms:", error);
    }
  };

  useEffect(() => {
    fetchPrograms();
    fetchSchoolTerms();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [searchQuery, yearLevel, program, schoolTerm]);

  const formatYearLevel = (yearLevel) => {
    switch (yearLevel) {
      case "FIRST":
        return "1st Year";
      case "SECOND":
        return "2nd Year";
      case "THIRD":
        return "3rd Year";
      case "FOURTH":
        return "4th Year";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="">
      <Sidebar />

      {/* Main Content */}
      <div className="ml-60 bg-base-200">
        <Navbar />

        <div className="p-8">
          <h1 className="font-bold text-xl mb-8 pl-4">List of Students</h1>

          <div className="card bg-white w-full shadow-xl">
            <div className="card-body">
              <div className="flex justify-between items-center mb-2">
                <div className="flex space-x-4">
                  <input
                    type="text"
                    placeholder="Search students here..."
                    className="input input-bordered w-72"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="flex space-x-4">
                  <select
                    className="select select-bordered"
                    value={schoolTerm}
                    onChange={(e) => setSchoolTerm(e.target.value)}
                  >
                    <option value="ALL">All School Terms</option>
                    {schoolTerms.map((term) => (
                      <option key={term.id} value={term.id}>
                        {term.name}
                      </option>
                    ))}
                  </select>

                  <select
                    className="select select-bordered"
                    value={yearLevel}
                    onChange={(e) => setYearLevel(e.target.value)}
                  >
                    <option value="ALL">All Years</option>
                    <option value="FIRST">1st Year</option>
                    <option value="SECOND">2nd Year</option>
                    <option value="THIRD">3rd Year</option>
                    <option value="FOURTH">4th Year</option>
                  </select>
                  <select
                    className="select select-bordered"
                    value={program}
                    onChange={(e) => setProgram(e.target.value)}
                  >
                    <option value="ALL">All Programs</option>
                    {programs.map((prog) => (
                      <option key={prog.id} value={prog.id}>
                        {prog.code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-between items-center mb-6">
                <div className="flex space-x-4">
                  <button
                    className="btn btn-xs btn-outline"
                    onClick={() => setIsModalOpen(true)}
                  >
                    Add Student
                  </button>
                  <button
                    className="btn btn-xs btn-outline"
                    onClick={() => setIsUploadModalOpen(true)}
                  >
                    Upload Students
                  </button>
                  <button
                    className="btn btn-sm btn-outline"
                    disabled={selectedStudents.length === 0}
                    onClick={() => setSchoolTermModalOpen(true)}
                  >
                    Update School Term
                  </button>
                </div>
                <div>
                  <button
                    className="btn btn-xs bg-gray-900 text-white hover:bg-gray-800"
                    onClick={handleDownloadCsv}
                  >
                    Download as csv
                  </button>
                </div>
              </div>

              <table className="table w-full">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        onChange={(e) =>
                          setSelectedStudents(
                            e.target.checked ? students.map((s) => s.id) : []
                          )
                        }
                        checked={
                          students.length > 0 &&
                          selectedStudents.length === students.length
                        }
                      />
                    </th>
                    <th>Student Name</th>
                    <th>Student No.</th>
                    <th>Email</th>
                    <th>Year Level</th>
                    <th>Program</th>
                    <th>Curriculum</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => {
                            if (selectedStudents.includes(student.id)) {
                              setSelectedStudents(
                                selectedStudents.filter(
                                  (id) => id !== student.id
                                )
                              );
                            } else {
                              setSelectedStudents([
                                ...selectedStudents,
                                student.id,
                              ]);
                            }
                          }}
                        />
                      </td>

                      <td>
                        {student.firstName} {student.lastName}
                      </td>
                      <td>{student.studentId}</td>
                      <td>{student.email}</td>
                      <td>{formatYearLevel(student.yearLevel)}</td>
                      <td>{student.program.code}</td>
                      <td>
                        {student.studentCourse[0]?.course.curriculum.code ||
                          "None"}
                      </td>

                      <td className="flex flex-col space-y-2">
                        <button
                          className="btn btn-xs btn-outline"
                          onClick={() => handleViewDetails(student)}
                        >
                          View details
                        </button>
                        <button
                          className="btn btn-xs btn-outline"
                          onClick={() => handleDelete(student.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between items-center mt-4">
                <p className="text-sm">1 of 1</p>
                <div className="flex space-x-2">
                  <button className="btn btn-outline">&lt;</button>
                  <button className="btn btn-outline">&gt;</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {schoolTermModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-2xl">
            <h3 className="font-bold text-lg mb-4">
              Update School Term for Selected Students
            </h3>

            <div className="mb-4">
              <label className="block text-sm mb-2">Select School Term</label>
              <select
                className="select select-bordered w-full"
                value={selectedSchoolTerm || ""}
                onChange={(e) => setSelectedSchoolTerm(e.target.value)}
              >
                <option value="">Select Term</option>
                {schoolTerms.map((term) => (
                  <option key={term.id} value={term.id}>
                    {term.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-action mt-4">
              <button
                className="btn btn-success"
                disabled={!selectedSchoolTerm}
                onClick={async () => {
                  try {
                    await axios.patch(
                      `${PORT}/students/update/schoolTerm`,
                      {
                        userIds: selectedStudents,
                        schoolTermId: parseInt(selectedSchoolTerm),
                      },
                      {
                        headers: {
                          Authorization: `Bearer ${localStorage.getItem(
                            "access_token"
                          )}`,
                        },
                      }
                    );
                    alert("School term updated successfully!");
                    setSelectedStudents([]);
                    setSelectedSchoolTerm(null);
                    setSchoolTermModalOpen(false);
                    fetchStudents();
                  } catch (error) {
                    console.error("Error updating school term:", error);
                    alert("Update failed. Try again.");
                  }
                }}
              >
                Confirm
              </button>
              <button
                className="btn btn-error"
                onClick={() => setSchoolTermModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Add Students</h3>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="mt-4 grid grid-cols-2 gap-4"
            >
              <div>
                <label className="block text-sm">First Name</label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  {...register("firstName", {
                    required: "First name is required",
                  })}
                />
                {errors.firstName && (
                  <span className="text-red-500 text-sm">
                    {errors.firstName.message}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-sm">Last Name</label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  {...register("lastName", {
                    required: "Last name is required",
                  })}
                />
                {errors.lastName && (
                  <span className="text-red-500 text-sm">
                    {errors.lastName.message}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-sm">Student ID</label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  {...register("studentId", {
                    required: "Student ID is required",
                  })}
                />
                {errors.studentId && (
                  <span className="text-red-500 text-sm">
                    {errors.studentId.message}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-sm">Username</label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  {...register("username", {
                    required: "Username is required",
                  })}
                />
                {errors.username && (
                  <span className="text-red-500 text-sm">
                    {errors.username.message}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-sm">Course</label>
                <select
                  className="select select-bordered w-full"
                  {...register("programId", { required: "Course is required" })}
                >
                  <option value="">Select Course</option>
                  {programs.map((prog) => (
                    <option key={prog.id} value={prog.id}>
                      {prog.code}
                    </option>
                  ))}
                </select>
                {errors.programId && (
                  <span className="text-red-500 text-sm">
                    {errors.programId.message}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-sm">Email Address</label>
                <input
                  type="email"
                  className="input input-bordered w-full"
                  {...register("email", { required: "Email is required" })}
                />
                {errors.email && (
                  <span className="text-red-500 text-sm">
                    {errors.email.message}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-sm">Address</label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  {...register("address", { required: "Address is required" })}
                />
                {errors.address && (
                  <span className="text-red-500 text-sm">
                    {errors.address.message}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-sm">Password</label>
                <input
                  type="password"
                  className="input input-bordered w-full"
                  value="password"
                  disabled
                  {...register("password")}
                />
              </div>
              <div className="modal-action col-span-2 flex justify-between">
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Student Modal */}
      {isViewModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Student Information</h3>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="mt-4 grid grid-cols-2 gap-4"
            >
              <div>
                <label className="block text-sm">First Name</label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  {...register("firstName", {
                    required: "First name is required",
                  })}
                />
                {errors.firstName && (
                  <span className="text-red-500 text-sm">
                    {errors.firstName.message}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-sm">Last Name</label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  {...register("lastName", {
                    required: "Last name is required",
                  })}
                />
                {errors.lastName && (
                  <span className="text-red-500 text-sm">
                    {errors.lastName.message}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-sm">Student ID</label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  {...register("studentId", {
                    required: "Student ID is required",
                  })}
                />
                {errors.studentId && (
                  <span className="text-red-500 text-sm">
                    {errors.studentId.message}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-sm">Username</label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  {...register("username", {
                    required: "Username is required",
                  })}
                />
                {errors.username && (
                  <span className="text-red-500 text-sm">
                    {errors.username.message}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-sm">Course</label>
                <select
                  className="select select-bordered w-full"
                  {...register("programId", { required: "Course is required" })}
                >
                  <option value="">Select Course</option>
                  {programs.map((prog) => (
                    <option key={prog.id} value={prog.id}>
                      {prog.code}
                    </option>
                  ))}
                </select>
                {errors.programId && (
                  <span className="text-red-500 text-sm">
                    {errors.programId.message}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-sm">Email Address</label>
                <input
                  type="email"
                  className="input input-bordered w-full"
                  {...register("email", { required: "Email is required" })}
                />
                {errors.email && (
                  <span className="text-red-500 text-sm">
                    {errors.email.message}
                  </span>
                )}
              </div>
              <div>
                <label className="block text-sm">Address</label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  {...register("address", { required: "Address is required" })}
                />
                {errors.address && (
                  <span className="text-red-500 text-sm">
                    {errors.address.message}
                  </span>
                )}
              </div>

              <div className="modal-action col-span-2 flex justify-between">
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsViewModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Upload Students Modal */}
      {isUploadModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Upload Students</h3>
            <div className="mt-4">
              <label className="block text-sm">CSV File</label>
              <input
                type="file"
                accept=".csv"
                className="file-input file-input-bordered w-full"
                onChange={(e) => setCsvFile(e.target.files[0])}
              />
            </div>
            <div className="modal-action">
              <button
                className="btn bg-red-500 hover:bg-red-600 text-white"
                onClick={handleUpload}
              >
                Upload
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setIsUploadModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
