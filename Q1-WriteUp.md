# Improving elevator experience 

## Abstract
In the last few decades, There has been significant development in technologies like AI/ML, GPU, etc., but the same has not been reflected in Elevator/Lift Scheduling.
In this document, we will explore how we can improve the elevator experience.

Lets Start!

## Parameters

 1. Waiting Time 
 2. Flight Time  (Time spent inside lift)
 3. Length of Path 
 4. Passengers, Waiting 
 5. Passengers, Inside the Lift

(Note : We are assuming we can capture these paraments by a cameras)

# Proposals

**Proposal 1: More exploration of Search Space** 
To explore a search space of Lift Scheduling we don't use Depth First Search because of combinatorial explosion, rather we use a heuristic-based approach to decide the direction of the elevator concerning the current floor and then serve all passengers in that direction.
Due to advancements in GPU and parallel processing, now we can explore a search space much deeper.
We can use various AI-based algorithm which does so by staying in a limit. 
For ex. Branch and Bound, A* 

**Proposal 2 - New Heuristic**
Now, AI algorithms are as good as the heuristic is.
The current heuristic is constrained from [starvation issue](https://softwareengineering.stackexchange.com/questions/331692/what-algorithm-is-used-by-elevators-to-find-the-shortest-path-to-travel-floor-or), hence it proposes a unilateral path.
Can we create a new heuristic, which allows a little deviation from a unilateral path?

For ex: 
Consider Lift is on the 1000th floor, and there is only one passenger at 1001 who wants to go down, and there are multiple passengers down going down only.
In today's case we will not go up to 1001 and then go down, because if we do it, a starvation case could happen.

With the new heuristic what we can do is, we can allow reverse propagation up to a certain limit.
Now to determine this limit, either we can use preexisting data or can do reinforcement learning.

We can even better the above proposal if multiple lifts are moving in the same direction
Consider the following proposal for that.

**Proposal 3: Passenger Exchange in Lifts in Realtime and Multi-Lift Paths**
In today's scenario, we don't group people in realtime when they are in different elevators.
Consider LIFT 1 going with passenger A from 100 to 1, it's now at 50, and at this moment passenger B "Press 3 from" 53.
In today's case, we will allot LIFT 2 to B.
And both 1 and 2 will travel down without full capacity.

Can, we better this case by allowing passenger exchange in real-time?
Consider the following
**LIFT A (50):** PASSENGER A LEAVE AND WAIT (Notified about next lift they has to board)
**LIFT B (53) :** PASSENGER B BOARD
**LIFT B:** GO DOWN
**LIFT B (50):** PASSENGER A BOARD

Now we can extend proposal 3 to a broader perspective, 
**Can we construct a Muti Lift path for passengers from start only?**

**Proposal 4:**  
Elevators serving floors in distant destinations only, like 10, 20... , and from there people can use stairs.
Just like Commute in Metro vs Car
(Found this already exists : ) )

**Proposal 5: Improving Aesthetics**
Now if we cant decrease flight/waiting time we can at least make it less sufferable.
There can be various approaches to this.
	1) Grouping friends and family together (Will require dataset first)
	2) If passengers to lift ratio is comparable, we can add a personalized touch
			for ex: Understanding user's usage patterns, and being there before called.







