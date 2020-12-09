## Achievements :

 1. **Modularity**- The functionalities are well separated and defined.
 2.   **Reliability** - The required results are acheived for all states and possible set of rules without any failure. 
 3.  **Performance** - The search space is explored using heuristic hence we have avoided the combinatorial explosion. Asynchronous methods are used, wherever needed for non-blocking I/0.

 5. **Portability**- The code doesn't have any os dependency.
 6. **Scalability** - Due to polynomial time algorithm and non-blocking I/0, system can scale to high number of states.

  

## Things that can be Improved

-   **Fault-tolerance**- Exceptions are not catched
-    **Tight Coupling**- Due to my lack of experience with Rule-Based Systems, I was not able to decouple rules from code. 
