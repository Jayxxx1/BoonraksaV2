import prisma from "../../src/prisma/client.js";
import {
  StatusLabels,
  RoleLabels,
  PreorderStatusLabels,
  OrderFlowTypeLabels,
} from "../orders/order.constants.js";

export const getMasterPositions = async (req, res) => {
  try {
    const positions = await prisma.masterEmbroideryPosition.findMany({
      orderBy: { id: "asc" },
    });
    res.status(200).json({ success: true, data: positions });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching master positions" });
  }
};

export const createMasterPosition = async (req, res) => {
  try {
    const { name } = req.body;
    const position = await prisma.masterEmbroideryPosition.create({
      data: { name },
    });
    res.status(201).json({ success: true, data: position });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error creating master position" });
  }
};

export const getMasterConstants = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        statusLabels: StatusLabels,
        roleLabels: RoleLabels,
        preorderLabels: PreorderStatusLabels,
        flowTypeLabels: OrderFlowTypeLabels,
      },
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching constants" });
  }
};
