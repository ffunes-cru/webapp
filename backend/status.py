# status_manager.py

# A dictionary to store the job statuses.
# This acts as your in-memory database.
global_job_status = {}
global_job_events = {}

def update_job_status(job_id, new_status_data, stop_event=None):
    """
    Updates the status for a specific job ID.
    """
    if job_id not in global_job_status:
        global_job_status[job_id] = {}
    
    if job_id not in global_job_events:
        global_job_events[job_id] = None

    global_job_status[job_id].update(new_status_data)
    global_job_events[job_id] = stop_event

def get_job_status(job_id):
    """
    Retrieves the status for a specific job ID.
    """
    return global_job_status.get(job_id, None)

def get_job_event(job_id):
    """
    Retrieves the status for a specific job ID.
    """
    return global_job_events[job_id]

def delete_job_status(job_id):
    """
    Removes a job from the status manager.
    """
    if job_id in global_job_status:
        del global_job_status[job_id]