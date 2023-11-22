import React, {useState} from 'react';

const GetClosestBuildingsForm: React.FC = () => {
  const [distance, setDistance] = useState('0');
  const [tableRows, setTableRows] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const busLoop = {lat: 49.2675373, lon: -123.2474431}

  const submit = async () => {
    // let query = {};

    // await fetch("http://localhost:4321/query",
    // {
    //   method: "Post",
    //   body: JSON.stringify(query)
    // })
    setLoading(true);
    try {
      const result = await fetch("http://localhost:4321/datasets");
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
          <tr>
            <td>{row["id"]}</td>
            <td>{row["kind"]}</td>
            <td>{row["numRows"]}</td>
          </tr>
        )
      })
      
    )
  }


    return (
        <div style={{width:'100%', margin: 0, padding: 0, height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'felx-start', alignItems: 'center'}}>
      <h1 style={{ width: '100%', textAlign: 'center' }}>Lazy Student</h1>
      <div style={{justifyContent: 'flex-start'}}>
        <input type="number" value={distance} onChange={(event)=>setDistance(event.target.value)} placeholder='Enter distance (m)'></input>
        <button onClick={submit}>Submit</button>
      </div>
      <div style={{visibility: loading ? "visible":"hidden"}}>loading...</div>
      <table style={{visibility: submitted ? "visible":"hidden"}}>
        <thead>
        <tr>
          <th>ID</th>
          <th>Kind</th>
          <th>Number of Rows</th>
        </tr>
        </thead>
        <tbody>{renderTable()}</tbody>
        
      </table>
    </div>
    );
};

export default GetClosestBuildingsForm;