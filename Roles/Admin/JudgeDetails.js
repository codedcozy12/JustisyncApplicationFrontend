document.addEventListener('DOMContentLoaded', function () {
    const container = document.getElementById('judge-details-container');
    const loadingMessage = document.getElementById('loading-message');
    const judgesApiUrl = 'https://localhost:7020/api/v1.0/Judges';
    const courtsApiUrl = 'https://localhost:7020/api/v1.0/Courts';

    const urlParams = new URLSearchParams(window.location.search);
    const judgeId = urlParams.get('id');

    if (!judgeId) {
        loadingMessage.style.display = 'none';
        container.innerHTML = '<p class="text-center text-red-500">No judge ID provided in the URL.</p>';
        return;
    }

    const getFullImageUrl = (url) => {
        const defaultAvatar = '/';
        if (!url) return defaultAvatar;
        if (url.startsWith('http')) return url;
        return `https://localhost:7020/UserImages/Images/${url.replace(/^\//, '')}`;
    };
    
    async function fetchJudgeDetails() {
        try {
            const [judgeResponse, courtsResponse] = await Promise.all([
                fetch(`${judgesApiUrl}/${judgeId}`),
                fetch(courtsApiUrl)
            ]);

            if (!judgeResponse.ok) throw new Error('Judge not found or failed to load data.');
            if (!courtsResponse.ok) throw new Error('Failed to load court data.');

            const judgeResult = await judgeResponse.json();
            const courtsResult = await courtsResponse.json();

            const judge = judgeResult.data;
            const allCourts = courtsResult.data || [];

            const assignedCourt = allCourts.find(c => c.id === judge.courtAssignedId);
            const courtName = assignedCourt ? `${assignedCourt.name}, ${assignedCourt.city}` : 'N/A';

            renderJudgeDetails(judge, courtName);

        } catch (error) {
            loadingMessage.style.display = 'none';
            container.innerHTML = `<p class="text-center text-red-500">${error.message}</p>`;
        }
    }

    function renderJudgeDetails(judge, courtName) {
        loadingMessage.style.display = 'none';

        const fullName = `${judge.firstName || ''} ${judge.middleName || ''} ${judge.lastName || ''}`.replace(/\s+/g, ' ').trim();
        const appointmentDate = judge.appointmentDate ? new Date(judge.appointmentDate).toLocaleDateString() : 'N/A';


        const detailsHtml = `
            <div class="flex flex-col md:flex-row items-center gap-8">
                <div class="flex-shrink-0">
                    <img src="${getFullImageUrl(judge.profilePictureUrl)}" alt="Profile Picture" class="w-32 h-32 rounded-full object-cover border-4 border-gray-200 shadow-md">
                </div>
                <div class="flex-1 text-center md:text-left">
                    <h3 class="text-3xl font-bold text-gray-800">${fullName}</h3>
                    <p class="text-gray-500">@${judge.username || 'N/A'}</p>
                </div>
            </div>

            <div class="mt-8 border-t border-gray-200 pt-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                    <p class="text-sm font-medium text-gray-500">Email Address</p>
                    <p class="text-lg text-gray-800">${judge.email || 'Not provided'}</p>
                </div>
                <div>
                    <p class="text-sm font-medium text-gray-500">Phone Number</p>
                    <p class="text-lg text-gray-800">${judge.phoneNumber || 'Not provided'}</p>
                </div>
                <div>
                    <p class="text-sm font-medium text-gray-500">Court Assigned</p>
                    <p class="text-lg text-gray-800">${courtName}</p>
                </div>
                <div>
                    <p class="text-sm font-medium text-gray-500">Appointment Date</p>
                    <p class="text-lg text-gray-800">${appointmentDate}</p>
                </div>
            </div>
        `;
        container.innerHTML = detailsHtml;
    }

    fetchJudgeDetails();
});