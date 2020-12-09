


<!-- PROJECT LOGO -->
<br />
<p align="center">
  <a href="https://github.com/othneildrew/Best-README-Template">
    <img src="https://us.123rf.com/450wm/urfandadashov/urfandadashov1808/urfandadashov180804009/106758684-.jpg?ver=6" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">LIFT SCHEDULING</h3>

  <p align="center">
    A Rule and Destination based Grouping  
  </p>
</p>


<!-- TABLE OF CONTENTS -->
<li>
      <a href="https://github.com/abhishekvispute/LIFT-Scheduling/blob/main/Q1-WriteUp.md">Question 1 - WriteUp</a>
</li>
<br>
<details open="open">
  <summary>Question 2</summary>
  <ol>
    <li>
      <a href="https://github.com/abhishekvispute/LIFT-Scheduling/blob/main/index.js">Source Code</a>
    </li>
    <li><a href="https://github.com/abhishekvispute/LIFT-Scheduling/blob/main/rules/rule1.json">Rule file for Guide 1 (Give priority to the disabled)</a>  </li>
    <li><a href="https://github.com/abhishekvispute/LIFT-Scheduling/blob/main/rules/rule2.json">Rule file for Guide 2 (Children should not be alone in the same lift as strangers)</a> </li>
    <li> Instructions
      <ul>
        <li><a href="https://github.com/abhishekvispute/LIFT-Scheduling/tree/main/instructions/withoutRules">Instructions without any rules</a></li>
        <li><a href="https://github.com/abhishekvispute/LIFT-Scheduling/tree/main/instructions/WithProrityToDisabled">Instructions with Rule 1</a></li>
        <li><a href="https://github.com/abhishekvispute/LIFT-Scheduling/tree/main/instructions/WithSafeChildern">Instructions with Rule 2</a></li>
        <li><a href="https://github.com/abhishekvispute/LIFT-Scheduling/tree/main/instructions/WithProrityToDisabledSafeChildern">Instructions with Rule 1 and 2</a></li>
      </ul>
    </li>
    <li><a href="https://github.com/abhishekvispute/LIFT-Scheduling/blob/main/DesignConsiderations.md">Design Considerations</a></li>
    <li><a href="https://github.com/abhishekvispute/LIFT-Scheduling/blob/main/DesignDecisions.md">Design Decisions</a></li>
    <li><a href="https://github.com/abhishekvispute/LIFT-Scheduling/blob/main/Installation.md">Installation Instructions</a></li>
  </ol>
</details>
<img src="https://github.com/abhishekvispute/LIFT-Scheduling/blob/main/Flow.png" alt="Flow Diagram" ">

### Rules :
#### PriorityToDisabled
1. If disabled people are waiting for a lift, once the lift arrives, they are boarded first.
2. If disabled people are in the lift, they are served first. (If any passengers destination comes in-between, he is allowed to leave)
3. If disabled people call a lift, they are responded on priority.

#### SafeChildern  
Children only board the lift if a parent is present inside the lift, if not they wait and board solo.


