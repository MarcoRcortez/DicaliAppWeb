package bo.edu.dicali.recruitment.repository;

import bo.edu.dicali.recruitment.model.CandidateProfileModel;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface CandidateProfileRepository extends MongoRepository<CandidateProfileModel, String> {
    Optional<CandidateProfileModel> findByUserId(String userId);
    List<CandidateProfileModel> findByProfileCompleteTrue();
}
