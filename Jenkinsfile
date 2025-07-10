pipeline {
    agent any // This tells Jenkins to run the pipeline on any available agent

    stages {
        stage('Checkout Code') { // A stage to fetch your code from Git
            steps {
                echo 'Starting Git checkout...'
                // This command tells Jenkins to clone the repository configured in the job settings.
                checkout scm
                echo 'Code checked out successfully!'
            }
        }

        stage('JS Analysis (Dockerized)') { // NEW STAGE: To run your Dockerized analyzer
            steps {
                echo 'Running JavaScript analysis using Docker image: js-analyzer-image...'
                script {
                    // Get the current Jenkins workspace path dynamically.
                    // This path is on the Jenkins agent (your Windows machine).
                    def workspacePath = env.WORKSPACE

                    // Run the Docker container
                    // --rm: Automatically remove the container after it exits to keep your system clean.
                    // -v "${workspacePath}:/app/workspace": This is the VOLUME MOUNT.
                    //     - It maps your Jenkins job's workspace (e.g., C:\...\mdemo)
                    //       to the /app/workspace directory INSIDE the Docker container.
                    // js-analyzer-image: This is the name of the Docker image you built.
                    // /app/workspace: This is the argument passed to your js_analyzer.py script's ENTRYPOINT.
                    //                 It tells your Python script where to look for .js files INSIDE the container.
                    bat "docker run --rm -v \"${workspacePath}:/app/workspace\" js-analyzer-image /app/workspace"
                }
                echo 'Dockerized JavaScript analysis complete.'
            }
        }

        stage('Build and Verify') { // Your existing verification stage
            steps {
                echo 'Running build and verification steps...'
                bat 'dir' // Lists directory contents (now including checked out files)
                bat 'git --version' // Checks Git installation
                echo 'Basic verification complete.'
            }
        }
    }
}
