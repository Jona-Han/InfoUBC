import React, {useState} from 'react';
import {distanceQuery, filterQueryResult} from '../QueryUtil/distanceQuery'

const GetClosestBuildingsForm: React.FC = () => {
  const [distance, setDistance] = useState('');
  const [tableRows, setTableRows] = useState([{fullname: '', shortname: '', address: ''}]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const tableStyle = `
  #buildings {
    font-family: Arial, Helvetica, sans-serif;
    border-collapse: collapse;
    width: 100%;
  }
  
  #buildings td, #buildings th {
    border: 1px solid #ddd;
    padding: 8px;
  }
  
  #buildings tr:nth-child(even){background-color: #f2f2f2;}
  
  #buildings tr:hover {background-color: #ddd;}
  
  #buildings th {
    padding-top: 12px;
    padding-bottom: 12px;
    text-align: left;
    background-color: #04AA6D;
    color: white;
  }
  `

  const submit = async () => {
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
          <tr key={row["shortname"]}>
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
        <p>Enter a distance in meters to find buildings within that distance from the bus loop</p>
        <input type="number" value={distance} onChange={(event)=>setDistance(event.target.value)} placeholder='Enter distance (m)'></input>
        <button onClick={submit}>Submit</button>
      </div>
      <div style={{visibility: loading ? "visible":"hidden"}}>loading...</div>
      <div style={{visibility: submitted ? "visible":"hidden"}}>
      <div>Showing {tableRows.length} results</div>
      <head>
<style>
{tableStyle}
</style>
</head>
      <table id='buildings'>
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
    </div>
    );
};

export default GetClosestBuildingsForm;