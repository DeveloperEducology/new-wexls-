import { dataGraphsTopicContract } from './generators/math/topics/data-graphs/index.js';
import { somTopicContract } from './generators/math/topics/standard-object-measurement/index.js';

export const topicContracts = [
  dataGraphsTopicContract,
  somTopicContract
];

export function findTopicContract(subject, topic) {
  return topicContracts.find(
    (contract) => contract.subject === subject && contract.topic === topic
  );
}