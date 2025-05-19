import { useEffect, useState } from "react";
import axios from "axios";
import { Navbar } from "../../components/ui/Navbar";
import { Sidebar } from "../../components/ui/Sidebar";
import { PORT } from "../../utils/constants";

export function Assignment() {
  const [students, setStudents] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [yearLevel, setYearLevel] = useState("ALL");
  const [program, setProgram] = useState("ALL");
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [coaches, setCoaches] = useState([]);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);

  const fetchStudents = async () => {
    try {
      const response = await axios.get(`${PORT}/students`, {
        params: {
          q: searchQuery,
          filterByYearLevel: yearLevel !== "ALL" ? yearLevel : undefined,
          filterByProgram: program !== "ALL" ? program : undefined,
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

  const fetchCoaches = async () => {
    try {
      const response = await axios.get(`${PORT}/coaches`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      setCoaches(response.data);
    } catch (error) {
      console.error("Error fetching coaches:", error);
    }
  };

  useEffect(() => {
    fetchPrograms();
    fetchCoaches();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [searchQuery, yearLevel, program]);

  const handleSelectStudent = (id) => {
    if (selectedStudents.includes(id)) {
      setSelectedStudents(
        selectedStudents.filter((studentId) => studentId !== id)
      );
    } else {
      setSelectedStudents([...selectedStudents, id]);
    }
  };

  const handleAssignCoach = async () => {
    const confirmAssign = window.confirm(
      "Are you sure you want to assign these students to this coach?"
 );
 if (!confirmAssign) return;
    try {
      const assignments = selectedStudents.map((studentId) => ({
        studentId: parseInt(studentId),
        coachId: parseInt(selectedCoach),
      }));

      await axios.post(
        `${PORT}/assignments/bulk`,
        { assignments },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      setIsAssignModalOpen(false);
      setSelectedStudents([]);
      setSelectedCoach(null);
      fetchStudents();
      window.alert("You successfully assigned the students.");
    } catch (error) {
      console.error("Error assigning coach:", error);
    }
  };

  const handleReassignCoach = async () => {
    const confirmReassign = window.confirm(
      "Are you sure you want to re-assign these students to this coach?"
  );
  if (!confirmReassign) return;
    try {
      const assignments = selectedStudents.map((studentId) => ({
        studentId: parseInt(studentId),
        coachId: parseInt(selectedCoach),
      }));

      await axios.patch(
        `${PORT}/assignments/bulk`,
        { assignments },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      setIsReassignModalOpen(false);
      setSelectedStudents([]);
      setSelectedCoach(null);
      fetchStudents();
      window.alert("You successfully re-assigned the students.");
    } catch (error) {
      console.error("Error re-assigning coach:", error);
    }
  };

  return (
    <div>
      <Sidebar />
      <div className="ml-60 bg-base-200">
        <Navbar />
        <div className="p-8">
          <h1 className="font-bold text-xl mb-8 pl-4">Curriculum Coach</h1>
          <div className="card bg-white w-full shadow-xl">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
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
              <div className="flex space-x-4 mb-4">
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => setIsAssignModalOpen(true)}
                  disabled={selectedStudents.length === 0}
                >
                  Assign Coach
                </button>
                <button
                  className="btn btn-warning"
                  onClick={() => setIsReassignModalOpen(true)}
                  disabled={selectedStudents.length === 0}
                >
                  Re-Assign
                </button>
              </div>
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        onChange={(e) =>
                          setSelectedStudents(
                            e.target.checked
                              ? students.map((student) => student.id)
                              : []
                          )
                        }
                      />
                    </th>
                    <th>Student Name</th>
                    <th>Email</th>
                    <th>Year Level</th>
                    <th>Program</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => handleSelectStudent(student.id)}
                        />
                      </td>
                      <td>
                        {student.firstName} {student.lastName}
                      </td>
                      <td>{student.email}</td>
                      <td>{student.yearLevel}</td>
                      <td>{student.program.code}</td>
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

      {isAssignModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-5xl">
            <h3 className="font-bold text-lg">Student Coach Assignment</h3>
            <table className="table w-full mt-4">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>Year Level</th>
                  <th>Course Code</th>
                </tr>
              </thead>
              <tbody>
                {students
                  .filter((student) => selectedStudents.includes(student.id))
                  .map((student) => (
                    <tr key={student.id}>
                      <td>
                        {student.firstName} {student.lastName}
                      </td>
                      <td>{student.email}</td>
                      <td>{student.yearLevel}</td>
                      <td>{student.program.code}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
            <div className="mt-4">
              <label className="block text-sm mb-2">Assigned to:</label>
              <select
                className="select select-bordered w-full"
                value={selectedCoach || ""}
                onChange={(e) => setSelectedCoach(e.target.value)}
              >
                <option value="">Select Coach</option>
                {coaches.map((coach) => (
                  <option key={coach.id} value={coach.id}>
                    {coach.firstName} {coach.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-action mt-4">
              <button
                className="btn btn-success"
                onClick={handleAssignCoach}
                disabled={!selectedCoach}
              >
                Confirm
              </button>
              <button
                className="btn btn-error"
                onClick={() => setIsAssignModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isReassignModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-5xl">
            <h3 className="font-bold text-lg">Reassign Coach</h3>
            <table className="table w-full mt-4">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>Year Level</th>
                  <th>Course ID</th>
                  <th>Course Code</th>
                </tr>
              </thead>
              <tbody>
                {students
                  .filter((student) => selectedStudents.includes(student.id))
                  .map((student) => (
                    <tr key={student.id}>
                      <td>
                        {student.firstName} {student.lastName}
                      </td>
                      <td>{student.email}</td>
                      <td>{student.yearLevel}</td>
                      <td>{student.courseId}</td>
                      <td>{student.program.code}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
            <div className="mt-4">
              <label className="block text-sm mb-2">Reassign to:</label>
              <select
                className="select select-bordered w-full"
                value={selectedCoach || ""}
                onChange={(e) => setSelectedCoach(e.target.value)}
              >
                <option value="">Select Coach</option>
                {coaches.map((coach) => (
                  <option key={coach.id} value={coach.id}>
                    {coach.firstName} {coach.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-action mt-4">
              <button
                className="btn btn-warning"
                onClick={handleReassignCoach}
                disabled={!selectedCoach}
              >
                Confirm
              </button>
              <button
                className="btn btn-error"
                onClick={() => setIsReassignModalOpen(false)}
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
