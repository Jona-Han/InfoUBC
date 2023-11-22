import React, {useState} from 'react';
import {distanceQuery, filterQueryResult} from '../QueryUtil/distanceQuery'

const GetClosestBuildingsForm: React.FC = () => {
  const [distance, setDistance] = useState('0');
  const [tableRows, setTableRows] = useState([{fullname: '', shortname: '', address: ''}]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    // let query = {};

    // await fetch("http://localhost:4321/query",
    // {
    //   method: "Post",
    //   body: JSON.stringify(query)
    // })
    setLoading(true);
    try {
      let query: string = JSON.stringify(distanceQuery(parseInt(distance)));
      const result = await fetch("http://localhost:4321/query",
      {
        method: "Post",
        body: query,
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await result.json();
      const filteredData = filterQueryResult(parseInt(distance), data["result"])
      setTableRows(filteredData);
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
            <td>{row["fullname"]}</td>
            <td>{row["shortname"]}</td>
            <td>{row["address"]}</td>
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
          <th>Building</th>
          <th>Code</th>
          <th>Address</th>
        </tr>
        </thead>
        <tbody>{renderTable()}</tbody>
        
      </table>
    </div>
    );
};

export default GetClosestBuildingsForm;