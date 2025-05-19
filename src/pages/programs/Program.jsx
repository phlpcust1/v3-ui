import { Sidebar } from "../../components/ui/Sidebar";
import { Navbar } from "../../components/ui/Navbar";
import ProgramCard from "../../components/programs/ProgramCard";
import { PORT } from "../../utils/constants";
import { useState, useEffect } from "react";
import axios from "axios";

const Program = () => {
  const [programs, setPrograms] = useState([]);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await axios.get(`${PORT}/programs`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });

        const processedPrograms = response.data.map((program) => {
          let passed = 0;
          let failed = 0;

          program.students.forEach((student) => {
            const hasFailed = student.studentCourse?.some(
              (course) => course.remark === "FAILED"
            );

            if (hasFailed) {
              failed += 1;
            } else {
              passed += 1;
            }
          });

          return {
            ...program,
            gradeSummary: {
              passed,
              failed,
            },
          };
        });

        setPrograms(processedPrograms);
      } catch (error) {
        console.error("Error fetching programs:", error);
      }
    };

    fetchPrograms();
  }, []);

  return (
    <div>
      <Sidebar />

      {/* main content */}
      <div className="ml-60 bg-base-200">
        <Navbar />
        <div className="p-8">
          <h1 className="font-bold text-xl mb-8 pl-4">Programs</h1>
          <div className="card bg-white w-full shadow-xl pb-10">
            <div className="card-body text-center">
              <h1 className="font-bold text-xl text-red-500">
                SCHOOL OF COMPUTER IN INFORMATION SCIENCES
              </h1>
              <section className="flex justify-center items-center flex-wrap gap-x-10 gap-y-5 mt-3">
                {programs.map((data) => {
                  return <ProgramCard key={data.id} program={data} />;
                })}
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Program;
