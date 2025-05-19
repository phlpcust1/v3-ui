import { Sidebar } from "../../components/ui/Sidebar";
import { Navbar } from "../../components/ui/Navbar";
import { useState, useEffect } from "react";
import axios from "axios";
import { PORT } from "../../utils/constants";
import { useNavigate, useParams } from "react-router-dom";

const CurriculumCoachesList = () => {
  const { id } = useParams(); // Get programId from URL params
  const [coaches, setCoaches] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCoaches, setFilteredCoaches] = useState([]);

  const [schoolTerms, setSchoolTerms] = useState([]);
  const [selectedSchoolTerm, setSelectedSchoolTerm] = useState("ALL");

  const navigate = useNavigate();

  useEffect(() => {
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

    fetchPrograms();
    fetchSchoolTerms();
  }, []);

  useEffect(() => {
    const fetchCoaches = async () => {
      try {
        const response = await axios.get(`${PORT}/coaches`, {
          params: {
            filterByProgram: id,
            filterBySchoolTerm:
              selectedSchoolTerm !== "ALL" ? selectedSchoolTerm : undefined,
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });

        setCoaches(response.data);
        setFilteredCoaches(response.data);
      } catch (error) {
        console.error("Error fetching coaches:", error);
      }
    };

    if (id) {
      fetchCoaches();
    }
  }, [id, selectedSchoolTerm]);

  useEffect(() => {
    const results = coaches.filter(
      (coach) =>
        coach.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coach.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coach.coachId.toString().includes(searchQuery)
    );
    setFilteredCoaches(results);
  }, [searchQuery, coaches]);

  return (
    <div>
      <Sidebar />

      {/* main content */}
      <div className="ml-60 bg-base-200">
        <Navbar />
        <div className="p-8">
          <h1 className="font-bold text-xl mb-8 pl-4">
            List of Curriculum Coaches
          </h1>
          <div className="card bg-white w-full shadow-xl">
            <div className="card-body text-center">
              <div className="flex justify-between items-center mb-2">
                {/* Left: Search Bar */}
                <div className="flex space-x-4">
                  <input
                    type="text"
                    placeholder="Search coaches here..."
                    className="input input-bordered w-72"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Right: School Term Dropdown */}
                <div className="flex space-x-4">
                  <button className="btn btn-outline btn-sm">
                    View Coaching Summary
                  </button>
                  <select
                    className="select select-bordered"
                    value={selectedSchoolTerm}
                    onChange={(e) => setSelectedSchoolTerm(e.target.value)}
                  >
                    <option value="ALL">All School Terms</option>
                    {schoolTerms.map((term) => (
                      <option key={term.id} value={term.id}>
                        {term.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Coach Name</th>
                    <th>Coach No.</th>
                    <th>Email</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCoaches.length > 0 ? (
                    filteredCoaches.map((coach) => (
                      <tr key={coach.id}>
                        <td>
                          {coach.firstName} {coach.lastName}
                        </td>
                        <td>{coach.coachId}</td>
                        <td>{coach.email}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() =>
                              navigate(`/programs/coach-details/${coach.id}`)
                            }
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="text-center text-gray-500">
                        No coaches found for this program.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurriculumCoachesList;
