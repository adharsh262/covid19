const express = require('express')
const path = require('path')

const dbPath = path.join(__dirname, 'covid19India.db')
const app = express()

app.use(express.json())

const sqlite3 = require('sqlite3')

const {open} = require('sqlite')

let db = null

const intalizieDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Satrting the Server ....')
    })
  } catch (e) {
    console.log(`Database Error ${e.message}`)
    process.exit(1)
  }
}

intalizieDbAndServer()

const statesCamelCase = stateslist => {
  return {
    stateId: stateslist.state_id,
    stateName: stateslist.state_name,
    population: stateslist.population,
  }
}

//to get the states list

app.get('/states/', async (request, response) => {
  const getStatesQuery = `
    
    SELECT
        state_id,state_name,population
    FROM
        state  ;  
    
    `

  const allStates = await db.all(getStatesQuery)
  response.send(allStates.map(each => statesCamelCase(each)))
})

//get each state using get

app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params

  const getEachState = `
  
  SELECT
    *
  FROM
    state
  WHERE
    state_id=${stateId}   ; 
  
  `

  const state = await db.get(getEachState)
  response.send(statesCamelCase(state))
})

//create district using post

app.post('/districts/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body

  const createDistrict = `
  
  INSERT INTO
    district(district_name, state_id, cases, cured, active, deaths)
  VALUES(
    '${districtName}',
    ${stateId},
    ${cases},
    ${cured},
    ${active},
    ${deaths}
  )  ;
  
  `

  const dbResponse = await db.run(createDistrict)
  response.send('District Successfully Added')
})

//get District using get api

const camelDistrict = eachDistrict => {
  return {
    districtId: eachDistrict.district_id,
    districtName: eachDistrict.district_name,
    stateId: eachDistrict.state_id,
    cases: eachDistrict.cases,
    cured: eachDistrict.cured,
    active: eachDistrict.active,
    deaths: eachDistrict.deaths,
  }
}
app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getEachDistrictQuery = `
  
  SELECT
    *
  FROM
    district
  WHERE
    district_id=${districtId}    ;
  
  `

  const district = await db.get(getEachDistrictQuery)
  response.send(camelDistrict(district))
})

//get all districts api

app.get('/district/', async (request, response) => {
  const getEachDistrictQuery = `
  
  SELECT
    *
  FROM
    district

   
    ;
  
  `

  const district = await db.all(getEachDistrictQuery)
  response.send(district)
})

// delete district api

app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteDistrictQuery = `
      
      DELETE FROM
        district
      WHERE
        district_id=${districtId}  ;
      
      `

  await db.run(deleteDistrictQuery)
  response.send('District Removed')
})

// updated district api

app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const {districtName, stateId, cases, cured, active, deaths} = request.body

  const updatedDistrictQuery = `
  
  UPDATE
    district
  SET
    district_name='${districtName}',
    state_id=${stateId},
    cases=${cases},
    cured=${cured},
    active${active},
    deaths=${deaths}
  WHERE
    district_id=${districtId}  ;
  `

  await db.run(updatedDistrictQuery)
  response.send('District Details Updated')
})

// total no of stats using get api

app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params

  const totalQuery = `
  
  SELECT
    sum(cases) AS totalCases,sum(cured) AS totalCured,sum(active) AS totalActive,sum(deaths) AS totalDeaths
  FROM
    district
  WHERE
    state_id=${stateId} 
  GROUP BY
    state_id
         ;
  
  
  `

  const stasts = await db.get(totalQuery)
  response.send(stasts)
})

//stateName by using District id using get api

app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params

  const stateNameByDistrict = `
  
  SELECT
    state_name AS stateName
  FROM
    state
  INNER JOIN district ON
    state.state_id=district.state_id
  WHERE
    district.district_id=${districtId};
  
  `
  const stateNamecons = await db.get(stateNameByDistrict)
  response.send(stateNamecons)
})

module.exports = app
