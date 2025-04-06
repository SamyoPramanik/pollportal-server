import { Router } from "express";
import {
    addGroup,
    addModerator,
    addOption,
    addSubpoll,
    availableMod,
    deletePoll,
    getGroups,
    getModerators,
    getOptions,
    getPoll,
    getResult,
    getSubpolls,
    getVoters,
    giveVote,
    removeGroup,
    removeModerator,
    removeOption,
    removeSubpoll,
    resultAvailable,
    update,
} from "../controllers/PollController.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyEmail } from "../middlewares/verityEmail.js";
import { verifyCreator } from "../middlewares/verifyCreator.js";
import { verifyModerator } from "../middlewares/verifyModerator.js";

const PollRouter = Router();

PollRouter.get("/:id", verifyToken, verifyEmail, verifyModerator, getPoll);
PollRouter.get(
    "/:id/options",
    verifyToken,
    verifyEmail,
    verifyModerator,
    getOptions
);
PollRouter.get(
    "/:id/groups",
    verifyToken,
    verifyEmail,
    verifyModerator,
    getGroups
);
PollRouter.get(
    "/:id/add-moderator/:std_id",
    verifyToken,
    verifyEmail,
    verifyModerator,
    verifyCreator,
    addModerator
);
PollRouter.get(
    "/:id/remove-moderator/:std_id",
    verifyToken,
    verifyEmail,
    verifyModerator,
    verifyCreator,
    removeModerator
);
PollRouter.post(
    "/:id/add-option",
    verifyToken,
    verifyEmail,
    verifyModerator,
    addOption
);
PollRouter.get(
    "/:id/remove-option/:option_id",
    verifyToken,
    verifyEmail,
    verifyModerator,
    removeOption
);
PollRouter.post(
    "/:id/add-group",
    verifyToken,
    verifyEmail,
    verifyModerator,
    addGroup
);
PollRouter.get(
    "/:id/remove-group/:group_id",
    verifyToken,
    verifyEmail,
    verifyModerator,
    removeGroup
);
PollRouter.get(
    "/:id/result",
    verifyToken,
    verifyEmail,
    verifyModerator,
    getResult
);
PollRouter.post("/:id/vote", verifyToken, verifyEmail, giveVote);
PollRouter.post(
    "/:id/update",
    verifyToken,
    verifyEmail,
    verifyModerator,
    update
);
PollRouter.get(
    "/:id/delete",
    verifyToken,
    verifyEmail,
    verifyCreator,
    deletePoll
);
PollRouter.get(
    "/:id/moderators",
    verifyToken,
    verifyEmail,
    verifyModerator,
    verifyCreator,
    getModerators
);
PollRouter.get(
    "/:id/subpolls",
    verifyToken,
    verifyEmail,
    verifyModerator,
    getSubpolls
);
PollRouter.get(
    "/:id/remove-subpoll",
    verifyToken,
    verifyEmail,
    verifyModerator,
    removeSubpoll
);
PollRouter.get(
    "/:id/add-subpoll",
    verifyToken,
    verifyEmail,
    verifyModerator,
    addSubpoll
);
PollRouter.get(
    "/:id/voters",
    verifyToken,
    verifyEmail,
    verifyModerator,
    getVoters
);
PollRouter.get(
    "/:id/resultAvailable",
    verifyToken,
    verifyEmail,
    resultAvailable
);
PollRouter.get("/:id/searchUser", verifyToken, verifyEmail, availableMod);

export default PollRouter;
