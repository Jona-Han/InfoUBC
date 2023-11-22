import React, {useState} from 'react';
import { getBestProfs } from '../QueryUtil/profQuery';

const GetBestProfsForm: React.FC = () => {
  const [courseDept, setCourseDept] = useState('');
  const [courseNumber, setCourseNumber] = useState('');
  const [tableRows, setTableRows] = useState([{sections_instructor: '', classAverage: 0, timesTaught: 0}]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      let query: string = JSON.stringify(getBestProfs(courseDept, courseNumber));
      const result = await fetch("http://localhost:4321/query",
      {
        method: "Post",
        body: query,
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await result.json();
      setTableRows(data["result"]);
      setSubmitted(true);
    } catch (err) {
      console.log(err)
    }finally {
      setLoading(false); 
    }
       
  }

  const renderTable = () => {
    return(
      tableRows.map((row) => {
        return(
          <tr key={row["sections_instructor"]}>
            <td>{row["sections_instructor"]}</td>
            <td>{row["classAverage"]}</td>
            <td>{row["timesTaught"]}</td>
          </tr>
        )
      })
      
    )
  }


    return (
        <div style={{width:'100%', margin: 0, padding: 0, height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'felx-start', alignItems: 'center'}}>
      <h1 style={{ width: '100%', textAlign: 'center' }}>Lazy Student</h1>
      <div style={{justifyContent: 'flex-start'}}>
        <input type="text" value={courseDept} onChange={(event)=>setCourseDept(event.target.value)} placeholder='Enter Course Department'></input>
        <input type="text" value={courseNumber} onChange={(event)=>setCourseNumber(event.target.value)} placeholder='Enter Course Number'></input>
        <button onClick={submit}>Submit</button>
      </div>
      <div style={{visibility: loading ? "visible":"hidden"}}>loading...</div>
      <div style={{visibility: submitted ? "visible":"hidden"}}>
        <div>Showing {tableRows.length} results</div>
      <table>
        <thead>
        <tr>
          <th>Name</th>
          <th>Class Average (%)</th>
          <th>Number of Times Taught</th>
        </tr>
        </thead>
        <tbody>{renderTable()}</tbody>
        
      </table>
      </div>
    </div>
    );
};

export default GetBestProfsForm;