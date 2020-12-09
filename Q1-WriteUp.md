# Improving elevator experience 

## Abstract
In the last few decades, There has been significant development in technologies like AI/ML, GPU, etc., but the same has not been reflected in Elevator or Lift Scheduling.
In this document, we will explore how we can improve the elevator experience.

## Parameters

 1. Waiting Time 
 2. Flight Time  (Time spent inside lift)
 3. Length of Path 
 4. Passengers, Waiting 
 5. Passengers, Inside the Lift

(Note : We can capture these paraments by a cameras)

# Proposals

## **Proposal 1: More exploration of Search Space**

To explore a search space of Lift Scheduling we don't use Depth First Search because of combinatorial explosion, rather we use a heuristic-based approach to decide the direction of the elevator w.r.t the current floor and then serve all passengers in that direction. </br>
Due to advancements in GPU and parallel processing, now we can explore a search space much deeper.
We can use various AI-based algorithm which does so by staying in a limit. 
For ex. Branch and Bound, A* 

## **Proposal 2 - New Heuristic**

AI algorithms are as good as the heuristic is. </br>
The current heuristic is constrained from [starvation issue](https://softwareengineering.stackexchange.com/questions/331692/what-algorithm-is-used-by-elevators-to-find-the-shortest-path-to-travel-floor-or), hence it proposes a unilateral path. </br>
Can we create a new heuristic, which allows a little deviation from a unilateral path?  </br>

For ex:  </br>
Consider Lift is on the 1000th floor, there is only one passenger at 1001 who wants to go down, and there are multiple passengers down to 1000, going down only. </br>
In today's case we will not go up to 1001 and then go down, because if we do it, a starvation case could happen. </br>

With the new heuristic what we can do is, we can allow reverse propagation up to a certain limit. </br>
Now to determine this limit, either we can use preexisting data or can do reinforcement learning. </br>

We can even better the above proposal if multiple lifts are moving in the same direction </br>
Consider the following proposal for that. </br>

## **Proposal 3: Passenger Exchange in Lifts in Realtime and Multi-Lift Paths**

In today's scenario, we don't group people in realtime when they are in different elevators. </br>
Consider LIFT 1 going with passenger A from 100 to 1, it's now at 50, and at this moment passenger B "Press 3 from" 53. </br>
In today's case, we will allot LIFT 2 to B, </br>
And both 1 and 2 will travel down without full capacity. </br>
 
Can, we better this case by allowing passenger exchange in real-time?  </br>
Consider the following  </br> </br>
**LIFT A (50):** PASSENGER A LEAVE AND WAIT (Notified about next lift they has to board) </br>
**LIFT B (53) :** PASSENGER B BOARD </br>
**LIFT B:** GO DOWN </br>
**LIFT B (50):** PASSENGER A BOARD </br>

Now can we extend proposal 3 to a broader perspective ? </br>
**Can we construct a Muti Lift path for passengers from start only?** </br>

## **Proposal 4: Express Elevators**

Elevators serving floors in distant destinations only, like 10, 20... , and from there people can use stairs. </br>
Just like Commute in Metro vs Car  </br>
(Found this already exists)

## **Proposal 5: Improving Aesthetics**

Now if we cant decrease flight/waiting time we can at least make it less sufferable. </br>
There can be various approaches to this. </br>
1. Grouping friends and family together. </br>
2. If passengers to lift ratio is comparable, we can add a personalized touch. </br>
			For ex: Understanding user's usage patterns, and being there before called.
### Thats All, Thanks !
