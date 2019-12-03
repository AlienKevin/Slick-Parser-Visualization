import React from 'react';
import Tree from "react-d3-tree";
import {Traverser} from "./generateParseTree";

const source =
// `foo : ƒ emoji1 emoji2
//     print ('hello world' & emoji1 & emoji2)
// _ :
//     foo '👋'
// `
// `
// person :
//   {
//     name : 'Ben'
//     age : 10
//   }

// _ :
//   person.name

// `

// `
// a :
//   case 3 of
//     0 →
//       0
//     1 →
//       1
//     2 →
//       2
//     _ →
//       3
// `

`
type Msg :
  Success Text
  Fail Text

msg :
  Success 'abc'

a :
  case msg of
    Success msg →
      msg
    Fail error →
      error
`

function App() {
  return (
    <div className="App" style={{width: "100%", height: "100vh"}}>
      <Tree
        data={new Traverser().traverse(source)}
        orientation="vertical"
        translate={{
          x: 600,
          y: 50
        }}
        textLayout={{
          textAnchor: 'middle',
          y: 20
        }}
        separation={{
          siblings: 1.25,
          nonSiblings: 1.5
        }}
      />
    </div>
  );
}

export default App;
