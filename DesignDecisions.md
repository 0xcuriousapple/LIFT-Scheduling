## Decision Statement: A data structure for States.

 - Requirement:  To store state
 - Our Choice : We defined data structure with respect to levels
   ```sh
   { 'currentLevel' : 
	   { "up" : { 	'destinationLevel' : [Passenger 1,[Passenger 2].... ]},
	    "down" : { 		'destinationLevel':[Passenger 1, [Passenger 2].... ] },		
   } }
   ```
   
 - Alternative : Mapping on the basis of passengers
   ```sh
    [ 'passenger_id' { current :  destination : } ]
    ```
  
 - Advantage :
	 
   - decideDirectionOfLift() is a most imp function
   of the whole system, there we decide direction() on the basis of
   how many no of people are waiting to be served in that direction. </br>
   now what this Data Structure allows us to do that in O(level).</br>
   ```sh 
   for (level in levelwise_situation)  
   direct access to level['up'].length and level['down'].length 
     ```
  
   
    - when we want to give, priority to people when the lift arrives at that level, we can do that without extra effort as we have dedicated a list per level.
    ```sh 
   SortbyPriorityToDisabledPeople()
     ```
   
  - Disadvantage: Grouping people of different levels is costly with this approach, which can easily be achieved by passenger wise mapping.

### Decision Statement:  Exploration of search space
- Requirement:  To find the shortest path
- Our Choice :
We traverse the search space using the heuristic-based approach to decide the direction of the elevator w.r.t the current floor and then serve all passengers in that direction.
- Alternative :
Doing DFS, to find the shortest path
- Advantage : 
The  combinatorial explosion and starvation case is avoided 

- Disadvantage.
Using heuristic may not find the shortest path altogether.



### Decision Statement:   I/O
- Requirement:  To read files 
- Our Choice: Using Async calls 
- Alternative: Using Sync calls
- Advantage:  Non-Blocking I/0  -> Performance increase
- Disadvantage.
We have to maintain, a data structure mapping filename to file.

### Decision Statement:  Rules Engine
- Requirement: To define rules 
- Our Choice: Not using a dedicated rules engine and using rules files just for identifiers and then having logic in code
- Alternative :
Using a dedicated rules engine like JSON-rules engine
- Advantage : 
No advantage as such, our current approach should be avoided considering the tight coupling it creates.