For this project, you’ll create a tool to manage humor flavors and humor flavor steps.


Create a new GitHub repository and new Vercel project.


The goal is to create a prompt chain tool that can:

1. Create new humor flavors
2. Create new steps for humor flavors
3. Edit steps for humor flavors
4. Reorder the steps of the humor flavor
5. Generate captions using an image test set

Use our REST API (api.almostcrackd.ai) from Assignment 5 to create captions using a given humor flavor in your prompt chain tool.

A humor flavor is a set of steps that run in specific order to create captions from an input image.

An example of a set of steps could be:

1. Take in an image and output a description it in text.
2. Take output from step 1 and output something funny about it.
3. Take the output from step 2 and output five short, funny captions.

You’ll want to design an interface that can:

1. only work if the user is logged in as profiles.is_superadmin==TRUE or profiles.is_matrix_admin==TRUE
2. create a humor flavor
3. update a humor flavor
4. delete a humor flavor
5. create a humor flavor step
6. update a humor flavor step
7. delete a humor flavor step
8. reorder a humor flavor step (move step 2 to step 1, etc)
9. read the captions produced by a specific humor flavor
10. support dark mode / light mode / system default mode
11. test a humor flavor by generating captions using the REST API