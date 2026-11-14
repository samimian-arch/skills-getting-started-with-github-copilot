document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function updateAvailability(activityCard, change) {
    const availability = activityCard.querySelector(".activity-availability");
    const updatedSpotsLeft = Number(availability.dataset.spotsLeft) + change;
    availability.dataset.spotsLeft = updatedSpotsLeft;
    availability.querySelector("span").textContent = `${updatedSpotsLeft} spots left`;
  }

  function showNoParticipantsMessage(participantsList) {
    const emptyMessage = document.createElement("li");
    emptyMessage.className = "no-participants";
    emptyMessage.textContent = "No participants yet";
    participantsList.appendChild(emptyMessage);
  }

  function addParticipant(name, email, participantsList, activityCard) {
    const participant = document.createElement("li");
    participant.className = "participant-entry";

    const participantEmail = document.createElement("span");
    participantEmail.textContent = email;
    participant.appendChild(participantEmail);

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "participant-delete";
    deleteButton.setAttribute("aria-label", `Unregister ${email} from ${name}`);
    deleteButton.title = "Unregister participant";
    deleteButton.innerHTML = `
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2" stroke-linecap="round"
           stroke-linejoin="round">
        <path d="M3 6h18"></path>
        <path d="M8 6V4h8v2"></path>
        <path d="m19 6-1 14H6L5 6"></path>
        <path d="M10 11v5"></path>
        <path d="M14 11v5"></path>
      </svg>
    `;

    deleteButton.addEventListener("click", async () => {
      deleteButton.disabled = true;

      try {
        const response = await fetch(
          `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(email)}`,
          { method: "DELETE" }
        );
        const result = await response.json();

        if (!response.ok) {
          messageDiv.textContent = result.detail || "Failed to unregister participant.";
          messageDiv.className = "error";
          messageDiv.classList.remove("hidden");
          deleteButton.disabled = false;
          return;
        }

        participant.remove();

        if (!participantsList.querySelector(".participant-entry")) {
          showNoParticipantsMessage(participantsList);
        }

        updateAvailability(activityCard, 1);
      } catch (error) {
        messageDiv.textContent = "Failed to unregister participant. Please try again.";
        messageDiv.className = "error";
        messageDiv.classList.remove("hidden");
        console.error("Error unregistering participant:", error);
        deleteButton.disabled = false;
      }
    });

    participant.appendChild(deleteButton);
    participantsList.appendChild(participant);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";
        activityCard.dataset.activityName = name;

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p class="activity-availability" data-spots-left="${spotsLeft}">
            <strong>Availability:</strong> <span>${spotsLeft} spots left</span>
          </p>
        `;

        const participantsSection = document.createElement("div");
        participantsSection.className = "participants";

        const participantsHeading = document.createElement("h5");
        participantsHeading.textContent = "Participants";
        participantsSection.appendChild(participantsHeading);

        const participantsList = document.createElement("ul");
        participantsList.className = "participant-list";

        if (details.participants.length > 0) {
          details.participants.forEach((email) => {
            addParticipant(name, email, participantsList, activityCard);
          });
        } else {
          showNoParticipantsMessage(participantsList);
        }

        participantsSection.appendChild(participantsList);
        activityCard.appendChild(participantsSection);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        const activityCard = Array.from(activitiesList.querySelectorAll(".activity-card"))
          .find((card) => card.dataset.activityName === activity);
        if (activityCard) {
          const participantsList = activityCard.querySelector(".participant-list");
          participantsList.querySelector(".no-participants")?.remove();
          addParticipant(activity, email, participantsList, activityCard);
          updateAvailability(activityCard, -1);
        }

        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
